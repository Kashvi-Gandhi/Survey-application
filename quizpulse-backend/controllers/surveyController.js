const { supabase } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// Debug endpoint to check responses table
const debugResponses = async (req, res) => {
  try {
    const { data: allResponses, error } = await supabase
      .from('responses')
      .select('*')
      .limit(10);

    if (error) {
      return errorResponse(res, 400, `Database error: ${error.message}`);
    }

    const { data: tableInfo, error: infoError } = await supabase
      .from('responses')
      .select('count(*)', { count: 'exact' });

    return successResponse(res, 200, 'Debug info', {
      total_count: tableInfo?.length || 0,
      sample_responses: allResponses || [],
      table_exists: !error
    });
  } catch (err) {
    return errorResponse(res, 500, 'Debug failed', err.message);
  }
};

// Get all surveys for the current user
const getSurveys = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching surveys for user: ${userId}`);

    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    console.log(`Found ${data?.length || 0} surveys for user ${userId}`);
    console.log('Surveys:', data?.map(s => ({ id: s.id, title: s.title, is_published: s.is_published })));

    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 200, 'Surveys retrieved successfully', data);
  } catch (err) {
    console.error('getSurveys error:', err);
    return errorResponse(res, 500, 'Failed to fetch surveys', err.message);
  }
};

// Get a single survey by ID with its questions (public endpoint for taking surveys)
const getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching survey by ID: ${id}`);

    // Fetch survey details (temporarily remove is_published filter for debugging)
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      // .eq('is_published', true)  // Temporarily commented out
      .single();

    console.log('Survey found:', survey ? { id: survey.id, title: survey.title, is_published: survey.is_published } : 'None');

    if (surveyError || !survey) {
      console.error('Survey error:', surveyError);
      return errorResponse(res, 404, 'Survey not found');
    }

    // Fetch questions for this survey
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_id', id)
      .order('order_index', { ascending: true });

    console.log(`Found ${questions?.length || 0} questions for survey ${id}`);

    if (questionsError) {
      console.error('Questions error:', questionsError);
      return errorResponse(res, 400, 'Failed to fetch survey questions: ' + questionsError.message);
    }

    // Map question types to frontend-expected format
    const mappedQuestions = (questions || []).map(q => ({
      ...q,
      type: q.question_type === 'single_select' ? 'mcq' :
            q.question_type === 'one_line' ? 'text' :
            q.question_type, // rating, multi_select, true_false stay the same
    }));

    // Combine survey with questions
    const surveyWithQuestions = {
      ...survey,
      questions: mappedQuestions
    };

    return successResponse(res, 200, 'Survey retrieved successfully', surveyWithQuestions);
  } catch (err) {
    console.error('getSurveyById error:', err);
    return errorResponse(res, 500, 'Failed to fetch survey', err.message);
  }
};

// Create a new Survey shell
// Create a new Survey shell
const createSurvey = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!title) {
      return errorResponse(res, 400, 'Survey title is required');
    }

    const { data, error } = await supabase
      .from('surveys')
      .insert([{
        title,
        description,
        created_by: userId
      }])
      .select()
      .single();

    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 201, 'Survey created successfully', data);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to create survey', err.message);
  }
};

// Copy questions from a Question Bank directly into a Survey
const addQuestionsFromBank = async (req, res) => {
  try {
    const { survey_id, bank_id } = req.body;

    if (!survey_id || !bank_id) {
      return errorResponse(res, 400, 'survey_id and bank_id are required');
    }

    // Fetch questions from bank (only pure bank questions, not copies already in surveys)
    const { data: bankQuestions, error: fetchErr } = await supabase
      .from('questions')
      .select('*')
      .eq('bank_id', bank_id)
      .is('survey_id', null);

    if (fetchErr) {
      return errorResponse(res, 400, 'Failed to fetch questions from bank: ' + fetchErr.message);
    }

    if (!bankQuestions || bankQuestions.length === 0) {
      return errorResponse(res, 404, 'No questions found in specified question bank');
    }

    // Map questions to duplicate under survey_id
    const surveyQuestions = bankQuestions.map(q => ({
      survey_id,
      bank_id,
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      is_required: q.is_required,
      options: q.options,
      correct_answer: q.correct_answer
    }));

    const { data, error } = await supabase
      .from('questions')
      .insert(surveyQuestions)
      .select();

    if (error) return errorResponse(res, 400, error.message);

    // Auto-publish survey after successfully importing questions
    const { error: publishError } = await supabase
      .from('surveys')
      .update({ is_published: true })
      .eq('id', survey_id);

    if (publishError) {
      console.warn('Failed to auto-publish survey:', publishError.message);
      // Don't fail the entire operation if publishing fails
    }

    return successResponse(res, 201, `Imported ${data.length} questions into survey successfully`, data);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to import questions to survey', err.message);
  }
};

// Import selected questions from a Question Bank into a Survey
const importSelectedQuestions = async (req, res) => {
  try {
    const { survey_id, bank_id, question_ids } = req.body;
    console.log(`Importing questions: survey=${survey_id}, bank=${bank_id}, questions=${question_ids?.length || 0}`);

    if (!survey_id || !bank_id || !question_ids || !Array.isArray(question_ids)) {
      return errorResponse(res, 400, 'survey_id, bank_id, and question_ids array are required');
    }

    // Fetch selected questions from bank
    const { data: bankQuestions, error: fetchErr } = await supabase
      .from('questions')
      .select('*')
      .eq('bank_id', bank_id)
      .in('id', question_ids)
      .is('survey_id', null);

    console.log(`Found ${bankQuestions?.length || 0} matching questions in bank`);

    if (fetchErr) {
      return errorResponse(res, 400, 'Failed to fetch questions from bank: ' + fetchErr.message);
    }

    if (!bankQuestions || bankQuestions.length === 0) {
      return errorResponse(res, 404, 'No matching questions found in specified question bank');
    }

    // Map questions to duplicate under survey_id
    const surveyQuestions = bankQuestions.map(q => ({
      survey_id,
      bank_id,
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      is_required: q.is_required,
      options: q.options,
      correct_answer: q.correct_answer
    }));

    const { data, error } = await supabase
      .from('questions')
      .insert(surveyQuestions)
      .select();

    if (error) return errorResponse(res, 400, error.message);

    console.log(`Inserted ${data?.length || 0} questions into survey`);

    // Auto-publish survey after successfully importing questions
    const { error: publishError } = await supabase
      .from('surveys')
      .update({ is_published: true })
      .eq('id', survey_id);

    if (publishError) {
      console.warn('Failed to auto-publish survey:', publishError.message);
    } else {
      console.log(`Survey ${survey_id} published successfully`);
    }

    return successResponse(res, 201, `Imported ${data.length} selected questions into survey successfully`, data);
  } catch (err) {
    console.error('importSelectedQuestions error:', err);
    return errorResponse(res, 500, 'Failed to import selected questions to survey', err.message);
  }
};

// Submit Survey Responses (Public or Authenticated)
const submitResponse = async (req, res) => {
  try {
    const { survey_id, answers, taker_name, taker_email } = req.body;
    const userId = req.user ? req.user.id : null;

    console.log(`Survey submission: survey=${survey_id}, answers=${answers?.length}, taker=${taker_name}, email=${taker_email}`);

    if (!survey_id || !answers || !Array.isArray(answers)) {
      return errorResponse(res, 400, 'survey_id and an array of answers are required');
    }

    // For anonymous submissions, require name and email
    if (!userId && (!taker_name || !taker_email)) {
      return errorResponse(res, 400, 'taker_name and taker_email are required for anonymous submissions');
    }

    // Insert individual responses directly into the responses table
    const responseRecords = answers.map(answer => ({
      survey_id,
      question_id: answer.question_id,
      respondent_id: userId,
      user_answer: typeof answer.response_text === 'object' ? answer.response_text : answer.response_text,
      is_correct: null, // Will be computed later if needed
      score_earned: 0, // Default, can be computed based on correct answers
      taker_name: taker_name || null,
      taker_email: taker_email || null
    }));

    const { data: insertedResponses, error: insertError } = await supabase
      .from('responses')
      .insert(responseRecords)
      .select();

    if (insertError) {
      console.error('Response insertion error:', insertError);
      return errorResponse(res, 400, insertError.message);
    }

    console.log(`Inserted ${insertedResponses?.length || 0} responses`);

    // Optionally compute scores for questions with correct answers
    if (insertedResponses && insertedResponses.length > 0) {
      for (const response of insertedResponses) {
        // Get the question to check for correct answer
        const { data: question } = await supabase
          .from('questions')
          .select('correct_answer, points')
          .eq('id', response.question_id)
          .single();

        if (question && question.correct_answer) {
          let isCorrect = false;
          let scoreEarned = 0;

          try {
            const userAnswer = typeof response.user_answer === 'object' 
              ? JSON.stringify(response.user_answer) 
              : String(response.user_answer);
            const correctAnswer = typeof question.correct_answer === 'object'
              ? JSON.stringify(question.correct_answer)
              : String(question.correct_answer);

            isCorrect = userAnswer === correctAnswer;
            scoreEarned = isCorrect ? (question.points || 1) : 0;

            // Update the response with computed values
            await supabase
              .from('responses')
              .update({ 
                is_correct: isCorrect,
                score_earned: scoreEarned 
              })
              .eq('id', response.id);
          } catch (e) {
            console.warn('Error computing score for response:', e.message);
          }
        }
      }
    }

    return successResponse(res, 201, 'Survey submitted successfully', { 
      response_count: insertedResponses.length,
      survey_id,
      taker_name: taker_name || 'Authenticated User'
    });
  } catch (err) {
    console.error('submitResponse error:', err);
    return errorResponse(res, 500, 'Failed to submit survey response', err.message);
  }
};

// Execute Database Stored Procedure: fn_get_survey_analytics
const getSurveyAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Fetching analytics for survey ID: ${id}`);

    // Get basic analytics from stored procedure (if it exists)
    let basicAnalytics = null;
    try {
      const { data } = await supabase.rpc('fn_get_survey_analytics', {
        p_survey_id: id
      });
      basicAnalytics = data;
    } catch (e) {
      console.log('Stored procedure not available, using direct queries');
    }

    // Get detailed responses with user information and answers
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select(`
        id,
        survey_id,
        question_id,
        respondent_id,
        user_answer,
        is_correct,
        score_earned,
        submitted_at,
        taker_name,
        taker_email,
        profiles:respondent_id (
          full_name,
          email
        ),
        questions:question_id (
          question_text,
          correct_answer,
          points
        )
      `)
      .eq('survey_id', id)
      .order('submitted_at', { ascending: false });

    console.log(`Found ${responses?.length || 0} response records`);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return errorResponse(res, 400, responsesError.message);
    }

    // Group responses by respondent
    const responsesByUser = {};
    (responses || []).forEach(response => {
      // Use taker_email for anonymous responses, respondent_id for authenticated
      const userKey = response.taker_email || response.respondent_id || `anonymous_${response.submitted_at}`;
      
      if (!responsesByUser[userKey]) {
        responsesByUser[userKey] = {
          student_name: response.taker_name || response.profiles?.full_name || 'Anonymous',
          student_email: response.taker_email || response.profiles?.email || 'N/A',
          submitted_at: response.submitted_at,
          answers: [],
          total_score: 0
        };
      }

      responsesByUser[userKey].answers.push({
        question_text: response.questions?.question_text || 'Unknown Question',
        user_answer: typeof response.user_answer === 'object' 
          ? JSON.stringify(response.user_answer) 
          : String(response.user_answer || ''),
        is_correct: response.is_correct,
        points: response.score_earned || 0
      });

      responsesByUser[userKey].total_score += (response.score_earned || 0);
    });

    // Convert to array format
    const formattedResponses = Object.values(responsesByUser);

    console.log(`Grouped into ${formattedResponses.length} user responses`);

    // Combine basic analytics with detailed responses
    const analyticsWithDetails = {
      ...(basicAnalytics || {}),
      total_responses: formattedResponses.length,
      calculated_at: new Date().toISOString(),
      responses: formattedResponses
    };

    return successResponse(res, 200, 'Survey analytics calculated successfully', analyticsWithDetails);
  } catch (err) {
    console.error('Analytics error:', err);
    return errorResponse(res, 500, 'Failed to execute analytics', err.message);
  }
};

module.exports = {
  debugResponses,
  getSurveys,
  getSurveyById,
  createSurvey,
  addQuestionsFromBank,
  importSelectedQuestions,
  submitResponse,
  getSurveyAnalytics
};