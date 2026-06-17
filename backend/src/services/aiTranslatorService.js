const Groq = require('groq-sdk');
const logger = require('../utils/logger');

// Retrieve the API key from environment variables
const apiKey = process.env.GROQ_API_KEY;

// Initialize the Groq client
const groq = apiKey ? new Groq({ apiKey }) : null;

/**
 * Translates a source query to a target database language using Groq.
 * @param {string} sourceQuery The original query
 * @param {string} sourceLanguage The source language (e.g., MySQL)
 * @param {string} targetLanguage The target language (e.g., MongoDB, Cypher)
 * @returns {Promise<string>} The translated query
 */
const translateQuery = async (sourceQuery, sourceLanguage, targetLanguage) => {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured in the backend environment.');
  }

  const prompt = `You are an expert database migration and query translation engineer.
Please translate the following ${sourceLanguage} query into ${targetLanguage}.
Respond ONLY with the translated query code, without any markdown formatting, backticks, or explanation.

Original ${sourceLanguage} Query:
${sourceQuery}

Translated ${targetLanguage} Query:
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile', // A fast, standard model on Groq
    });

    const text = chatCompletion.choices[0]?.message?.content || '';
    
    // Remove markdown code blocks if the model still includes them
    const cleanedText = text.trim().replace(/^```[\w]*\n/, '').replace(/\n```$/, '');
    
    return cleanedText;
  } catch (error) {
    logger.error('Error translating query with Groq:', error.message);
    
    // Fallback for API key issues (useful for academic demo)
    if (error.message.includes('403') || error.message.includes('API key not valid') || error.message.includes('401')) {
      logger.warn('Using mock translation fallback due to API restrictions.');
      return `/* 
 * [MOCK TRANSLATION] 
 * The Groq API returned an authentication/authorization error.
 * Ensure your GROQ_API_KEY is correct and active.
 * 
 * Simulated ${targetLanguage} translation:
 */
db.collection.find({ "status": "Completed" }) // Example syntax based on target`;
    }

    throw new Error(`Failed to translate query: ${error.message}`);
  }
};

module.exports = {
  translateQuery,
};
