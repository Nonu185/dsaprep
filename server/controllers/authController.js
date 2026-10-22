const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'dsa_placement_os_development_jwt_secret_key_change_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      preferences: user.preferences,
      createdAt: user.createdAt
    }
  });
};

/**
 * @desc Get public auth configuration (Google Client ID)
 * @route GET /api/auth/config
 * @access Public
 */
exports.getAuthConfig = (req, res) => {
  res.status(200).json({
    success: true,
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
};

/**
 * @desc Google OAuth verification and authentication
 * @route POST /api/auth/google
 * @access Public
 */
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential, code } = req.body;

    if (!credential && !code) {
      return res.status(400).json({
        success: false,
        message: 'Google authentication credential or authorization code is required.'
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID in server/.env.'
      });
    }

    let payload;

    if (credential) {
      // 1. Verify Google Identity Services ID Token
      const client = new OAuth2Client(clientId);
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        return res.status(401).json({
          success: false,
          message: `Google token verification failed: ${verifyErr.message}`
        });
      }
    } else if (code) {
      // 2. Exchange authorization code for tokens and verify
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const configuredUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
      const requestedUri = req.body.redirectUri || 'postmessage';

      let tokens;
      let usedClient;

      try {
        const oAuth2Client = new OAuth2Client(clientId, clientSecret, requestedUri);
        const resTokens = await oAuth2Client.getToken({
          code,
          redirect_uri: requestedUri
        });
        tokens = resTokens.tokens;
        usedClient = oAuth2Client;
      } catch (err1) {
        // Fallback between 'postmessage' and configured redirect URI if mismatch occurs
        const altUri = requestedUri === 'postmessage' ? configuredUri : 'postmessage';
        try {
          const altClient = new OAuth2Client(clientId, clientSecret, altUri);
          const resTokens = await altClient.getToken({
            code,
            redirect_uri: altUri
          });
          tokens = resTokens.tokens;
          usedClient = altClient;
        } catch (err2) {
          return res.status(401).json({
            success: false,
            message: `Google authorization code exchange failed: ${err1.message}`
          });
        }
      }

      try {
        const ticket = await usedClient.verifyIdToken({
          idToken: tokens.id_token,
          audience: clientId
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        return res.status(401).json({
          success: false,
          message: `Google token verification failed: ${verifyErr.message}`
        });
      }
    }

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Unable to retrieve verified Google profile.'
      });
    }

    // Google accounts must have a verified email
    if (payload.email_verified === false) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication rejected: Email address is not verified with Google.'
      });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || payload.given_name || 'Google User';
    const avatar = payload.picture || '';

    // Look up existing user by googleId OR by existing email (preserves user progress across identity linkages)
    let user = await User.findOne({
      $or: [
        { googleId },
        { email }
      ]
    });

    if (user) {
      // Update googleId and avatar if not yet attached
      let modified = false;
      if (!user.googleId || user.googleId !== googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (avatar && (!user.avatar || user.avatar !== avatar)) {
        user.avatar = avatar;
        modified = true;
      }
      if (name && (!user.name || user.name === 'Candidate' || user.name === 'Candidate A')) {
        user.name = name;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    } else {
      // Create new user for verified Google account
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        preferences: {
          dailyTarget: 5,
          preferredLanguage: 'Java',
          theme: 'dark'
        }
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Logout user and clear HTTP-only cookie
 * @route POST /api/auth/logout
 * @access Public
 */
exports.logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

/**
 * @desc Get currently authenticated user profile
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar || '',
      preferences: req.user.preferences,
      createdAt: req.user.createdAt
    }
  });
};

/**
 * @desc Update user preferences
 * @route PUT /api/auth/preferences
 * @access Private
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const updates = req.body;
    const allowed = [
      'dailyTarget',
      'preferredLanguage',
      'timezone',
      'theme',
      'revisionIntervals',
      'fontSize',
      'tabSize',
      'autosave',
      'defaultOrdering'
    ];

    const currentPreferences = req.user.preferences || {};
    allowed.forEach(key => {
      if (updates[key] !== undefined) {
        currentPreferences[key] = updates[key];
      }
    });

    req.user.preferences = currentPreferences;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully.',
      preferences: req.user.preferences
    });
  } catch (err) {
    next(err);
  }
};
