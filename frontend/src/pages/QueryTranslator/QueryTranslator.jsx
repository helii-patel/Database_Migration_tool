import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const languages = [
  'MySQL',
  'PostgreSQL',
  'Oracle SQL',
  'MS SQL Server',
  'MongoDB MQL',
  'Neo4j Cypher',
  'Elasticsearch Query DSL',
  'Firebase Firestore',
  'Apache Jena SPARQL'
];

const QueryTranslator = () => {
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState(languages[0]);
  const [targetLanguage, setTargetLanguage] = useState(languages[1]);
  const [translatedQuery, setTranslatedQuery] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!sourceQuery.trim()) {
      toast.error('Please enter a query to translate');
      return;
    }

    setIsTranslating(true);
    try {
      const response = await fetch('http://localhost:5000/api/query/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceQuery, sourceLanguage, targetLanguage }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Translation failed');
      }

      setTranslatedQuery(data.data.translatedQuery);
      toast.success('Query translated successfully!');
    } catch (error) {
      toast.error(error.message);
      setTranslatedQuery('Error: ' + error.message);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600 mb-2">
          AI Query Translator
        </h1>
        <p className="text-surface-400">
          Translate your MySQL queries into various database dialects and NoSQL query languages using Gemini AI.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Query Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-surface-800 bg-surface-800/50 flex justify-between items-center">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer appearance-none"
              >
                {languages.map((lang) => (
                  <option key={`src-${lang}`} value={lang} className="bg-surface-800 font-normal">Source: {lang}</option>
                ))}
              </select>
            </h2>
          </div>
          <textarea
            value={sourceQuery}
            onChange={(e) => setSourceQuery(e.target.value)}
            placeholder={`Enter your ${sourceLanguage} query here...`}
            className="flex-1 w-full bg-transparent p-4 text-surface-200 placeholder-surface-600 focus:outline-none resize-none font-mono min-h-[300px]"
          />
        </motion.div>

        {/* Target Query Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-surface-800 bg-surface-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-primary-500"></span>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="bg-surface-800 text-white text-sm rounded-lg border border-surface-700 px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>Target: {lang}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTranslating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Translating...
                </>
              ) : (
                <>Translate &rarr;</>
              )}
            </button>
          </div>
          
          <div className="flex-1 w-full bg-[#0d1117] p-4 text-green-400 font-mono overflow-auto min-h-[300px]">
            <pre className="whitespace-pre-wrap">{translatedQuery || '// Translated query will appear here'}</pre>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QueryTranslator;
