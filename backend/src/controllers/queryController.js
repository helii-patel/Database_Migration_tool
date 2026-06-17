const { translateQuery } = require('../services/aiTranslatorService');

const translate = async (req, res) => {
  try {
    const { sourceQuery, sourceLanguage, targetLanguage } = req.body;

    if (!sourceQuery || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'sourceQuery, sourceLanguage, and targetLanguage are required fields.',
      });
    }

    const translatedQuery = await translateQuery(sourceQuery, sourceLanguage, targetLanguage);

    return res.status(200).json({
      success: true,
      data: {
        sourceQuery,
        targetLanguage,
        translatedQuery,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during query translation.',
    });
  }
};

module.exports = {
  translate,
};
