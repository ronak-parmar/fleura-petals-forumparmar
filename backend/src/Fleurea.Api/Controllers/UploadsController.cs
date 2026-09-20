using Fleurea.Api.Dtos;
using Fleurea.Api.Errors;
using Microsoft.AspNetCore.Mvc;

namespace Fleurea.Api.Controllers;

[ApiController]
[Route("api/v1/uploads")]
public class UploadsController(IWebHostEnvironment env) : ControllerBase
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp",
    };

    private const long MaxUploadBytes = 5 * 1024 * 1024;

    [HttpPost]
    public async Task<ActionResult<UploadResultDto>> Upload([FromForm] IFormFile file)
    {
        if (file.Length > MaxUploadBytes)
            throw new ApiException(400, "FILE_TOO_LARGE", "Image must be under 5 MB.");

        if (!AllowedContentTypes.Contains(file.ContentType))
            throw new ApiException(400, "UNSUPPORTED_TYPE", "Please attach a JPG, PNG or WebP image.");

        var webRootPath = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var uploadsDir = Path.Combine(webRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}-{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        return new UploadResultDto($"/uploads/{fileName}");
    }
}
