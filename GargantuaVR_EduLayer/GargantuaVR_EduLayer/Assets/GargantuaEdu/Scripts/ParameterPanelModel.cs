using System.Collections.Generic;
using UnityEngine;
namespace GargantuaEdu
{
    /// Data model for the floating panel: name, value, unit, explanation per parameter.
    public class ParameterPanelModel : MonoBehaviour
    {
        public IBlackHoleRendererAdapter Renderer;
        public List<ParameterEntry> Parameters { get; private set; } = new List<ParameterEntry>();
        public event System.Action<string, float> OnChanged;

        void Awake()
        {
            var ta = Resources.Load<TextAsset>("GargantuaEdu/parameters");
            Parameters = Newtonsoft.Json.JsonConvert.DeserializeObject<List<ParameterEntry>>(ta.text);
        }
        public void Set(string id, float v)
        {
            var p = Parameters.Find(x => x.id == id); if (p == null) return;
            v = Mathf.Clamp(v, p.min, p.max);
            if (id == "spin") v = Mathf.Min(v, 0.998f);   // a* must remain < 1
            Renderer?.SetParameter(id, v); OnChanged?.Invoke(id, v);
        }
        public string Display(string id)
        {
            var p = Parameters.Find(x => x.id == id); var v = Renderer?.GetParameter(id) ?? p.@default;
            return $"{p.name}: {v:0.###} {p.unit}  [{LocalizationService.Instance.ClassificationName(p.classification)}]";
        }
    }
}
