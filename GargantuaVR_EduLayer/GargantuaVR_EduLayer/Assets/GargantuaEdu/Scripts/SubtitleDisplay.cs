using UnityEngine;
using TMPro;
namespace GargantuaEdu
{
    public class SubtitleDisplay : MonoBehaviour
    {
        [SerializeField] TMP_Text text; [SerializeField] CanvasGroup backdrop;
        public void Show(string s) { text.text = s; backdrop.alpha = 1; }
        public void Hide() => backdrop.alpha = 0;
        public void Apply(AccessibilitySettings a)
        {
            text.fontSize = Mathf.Lerp(24, 56, a.TextScale01);
            text.color = a.HighContrast ? Color.white : new Color(0.9f, 0.92f, 1f);
            backdrop.GetComponent<UnityEngine.UI.Image>().color = a.HighContrast ? Color.black : new Color(0, 0, 0, 0.6f);
            gameObject.SetActive(a.SubtitlesEnabled);
        }
    }
}
