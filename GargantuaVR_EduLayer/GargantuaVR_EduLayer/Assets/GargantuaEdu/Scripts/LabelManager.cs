using System.Collections.Generic;
using UnityEngine;
namespace GargantuaEdu
{
    /// Selectable educational labels with simple/advanced text, equation, classification and limitation.
    public class LabelManager : MonoBehaviour
    {
        public IBlackHoleRendererAdapter Renderer;
        public bool Advanced;
        readonly HashSet<string> visible = new HashSet<string>();
        public event System.Action<string> OnLabelSelected;
        public void Show(string id, bool on) { if (on) visible.Add(id); else visible.Remove(id); Renderer?.SetOverlay(id, on); }
        public void ShowOnly(IEnumerable<string> ids) { foreach (var v in new List<string>(visible)) Show(v, false); foreach (var i in ids) Show(i, true); }
        public void HideAll() => ShowOnly(new string[0]);
        public string Describe(string id)
        {
            var L = LocalizationService.Instance; var e = L.Label(id); if (e == null) return id;
            var body = Advanced ? e.advanced : e.simple;
            return $"{e.title}\n{body}\n{L.UI("equation")}: {e.equation}\n{L.UI("classification")}: {L.ClassificationName(e.classification)}\n{L.UI("limitation")}: {e.limitation}";
        }
        public void Select(string id) => OnLabelSelected?.Invoke(id);
    }
}
