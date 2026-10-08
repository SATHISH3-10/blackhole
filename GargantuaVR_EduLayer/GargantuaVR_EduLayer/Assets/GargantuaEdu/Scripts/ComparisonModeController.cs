using UnityEngine;
namespace GargantuaEdu
{
    /// A Newtonian reference, B relativistic-inspired approximation, C higher-quality (if implemented).
    public class ComparisonModeController : MonoBehaviour
    {
        public IBlackHoleRendererAdapter Renderer; public SubtitleDisplay Subtitles; public bool HighQualityAvailable;
        public void Show(int mode)
        {
            if (mode == 2 && !HighQualityAvailable) mode = 1;
            Renderer?.SetRenderMode(mode);
            var c = LocalizationService.Instance.Comparison()[mode];
            Subtitles.Show($"{c.title}\n{c.text}\nLimitation: {c.limit}\nNewtonian gravity does not reproduce all strong-field visual effects."); // limitation shown on every screen
        }
    }
}
