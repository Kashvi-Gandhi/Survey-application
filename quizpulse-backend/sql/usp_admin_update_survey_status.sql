CREATE OR ALTER PROCEDURE quiz.usp_admin_update_survey_status
    @p_survey_id UNIQUEIDENTIFIER,
    @p_status NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    SET @p_status = UPPER(LTRIM(RTRIM(@p_status)));
    IF @p_status NOT IN ('ACTIVE', 'CLOSED', 'ARCHIVED')
        THROW 50010, 'status must be ACTIVE, CLOSED, or ARCHIVED.', 1;

    UPDATE quiz.surveys
    SET status = @p_status,
        is_published = CASE WHEN @p_status = 'ACTIVE' THEN 1 ELSE 0 END,
        updated_at = SYSDATETIMEOFFSET()
    OUTPUT INSERTED.id, INSERTED.status, INSERTED.is_published
    WHERE id = @p_survey_id;
END
GO
