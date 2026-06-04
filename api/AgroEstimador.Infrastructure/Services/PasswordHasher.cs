using AgroEstimador.Application.Common.Interfaces;
using BCryptNet = BCrypt.Net.BCrypt;

namespace AgroEstimador.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    public string HashPassword(string password)
    {
        return BCryptNet.HashPassword(password);
    }

    public bool VerifyPassword(string password, string hash)
    {
        try
        {
            return BCryptNet.Verify(password, hash);
        }
        catch
        {
            return false;
        }
    }
}
