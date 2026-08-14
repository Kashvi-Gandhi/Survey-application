CREATE OR ALTER PROCEDURE quiz.usp_batch_create_questions
    @p_survey_id UNIQUEIDENTIFIER = NULL,
    @p_questions_json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF ISJSON(@p_questions_json) <> 1 OR NOT EXISTS (SELECT 1 FROM OPENJSON(@p_questions_json))
        THROW 50001, 'p_questions_json must be a non-empty JSON array.', 1;

    BEGIN TRANSACTION;

    DECLARE @created TABLE (
        id UNIQUEIDENTIFIER,
        bank_id UNIQUEIDENTIFIER NULL,
        survey_id UNIQUEIDENTIFIER NULL,
        question_text NVARCHAR(MAX),
        question_type NVARCHAR(50),
        options NVARCHAR(MAX) NULL
    );

    INSERT INTO quiz.questions (
        bank_id,
        survey_id,
        question_text,
        question_type,
        options,
        points,
        is_required,
        order_index,
        correct_answer
    )
    OUTPUT
        inserted.id,
        inserted.bank_id,
        inserted.survey_id,
        inserted.question_text,
        inserted.question_type,
        inserted.options
    INTO @created
    SELECT
        source.bank_id,
        COALESCE(@p_survey_id, source.survey_id),
        source.question_text,
        source.question_type,
        source.options,
        COALESCE(source.points, 1),
        COALESCE(source.is_required, 1),
        COALESCE(source.order_index, 1),
        source.correct_answer
    FROM OPENJSON(@p_questions_json)
    WITH (
        bank_id UNIQUEIDENTIFIER '$.bank_id',
        survey_id UNIQUEIDENTIFIER '$.survey_id',
        question_text NVARCHAR(MAX) '$.question_text',
        question_type NVARCHAR(50) '$.question_type',
        options NVARCHAR(MAX) '$.options' AS JSON,
        points INT '$.points',
        is_required BIT '$.is_required',
        order_index INT '$.order_index',
        correct_answer NVARCHAR(MAX) '$.correct_answer' AS JSON
    ) AS source;

    COMMIT TRANSACTION;
    SELECT * FROM @created;
END
GO
