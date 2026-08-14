CREATE OR ALTER PROCEDURE quiz.usp_admin_toggle_user_status
    @p_user_id UNIQUEIDENTIFIER,
    @p_is_active BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE quiz.profiles
    SET is_active = @p_is_active
    OUTPUT INSERTED.id, INSERTED.full_name AS name, INSERTED.email, INSERTED.is_active
    WHERE id = @p_user_id;
END
GO
