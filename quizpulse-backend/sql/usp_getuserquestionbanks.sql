CREATE OR ALTER PROCEDURE quiz.usp_getuserquestionbanks
    @p_user_id UNIQUEIDENTIFIER,
    @p_role NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        qb.id,
        qb.title,
        qb.description,
        qb.created_at,
        qb.is_global,
        owner_role.role_name AS created_by_role,
        qb.created_by,
        CAST(CASE WHEN qb.is_global = 1 OR LOWER(owner_role.role_name) = 'admin' THEN 1 ELSE 0 END AS BIT) AS is_master,
        owner.full_name AS creator_name,
        owner.email AS creator_email,
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
    WHERE LOWER(@p_role) = 'admin'
       OR (LOWER(@p_role) = 'surveyor'
           AND (qb.created_by = @p_user_id OR qb.is_global = 1))
    ORDER BY
        CASE WHEN qb.created_by = @p_user_id THEN 0 ELSE 1 END,
        qb.created_at DESC;
END
GO
