using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading.Tasks;

namespace NinjaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MusicController : ControllerBase
    {
        [HttpPost("upload")]
        public async Task<IActionResult> UploadTrack([FromForm] string trackTitle, [FromForm] IFormFile audioFile)
        {
            if (audioFile == null || audioFile.Length == 0)
                return BadRequest(new { message = "No file received." });

            if (!audioFile.ContentType.StartsWith("audio/"))
                return BadRequest(new { message = "Only audio files are allowed." });

            try
            {
                // Read into RAM, keeping the free server's hard drive clean
                using var memoryStream = new MemoryStream();
                await audioFile.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                /* * TODO: GOOGLE INTEGRATION HERE
                 * 1. Authenticate with Google Drive API
                 * 2. Upload memoryStream to Drive
                 * 3. Get the Drive File ID
                 * 4. Save the trackTitle and Drive File ID to Google Sheets API
                 */

                return Ok(new { 
                    message = $"'{trackTitle}' is ready. (Google Integration Pending)" 
                });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}