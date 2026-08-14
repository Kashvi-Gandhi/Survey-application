CREATE OR ALTER PROCEDURE quiz.usp_getuserquestionbanks
    @user_id NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        qb.id,
        qb.title,
        qb.description,
        qb.created_at,
        qb.is_global,
        CAST(CASE WHEN qb.is_global = 1 OR LOWER(owner_role.role_name) = 'admin' THEN 1 ELSE 0 END AS BIT) AS is_master,
        owner.full_name AS owner_name,
        (
            SELECT
                q.id,
                q.bank_id,
                q.question_text,
                q.question_type,
                q.options
            FROM quiz.questions q
            WHERE q.bank_id = qb.id
            FOR JSON PATH
        ) AS questions_json
    FROM quiz.question_banks qb
    LEFT JOIN quiz.profiles owner ON owner.id = qb.created_by
    LEFT JOIN quiz.role_master owner_role ON owner_role.id = owner.role_id
    WHERE qb.created_by = @user_id
       OR qb.is_global = 1
       OR LOWER(owner_role.role_name) = 'admin'
       OR @user_id IS NULL
    ORDER BY
        CASE WHEN qb.created_by = @user_id THEN 0 ELSE 1 END,
        qb.created_at DESC;
END
GO
