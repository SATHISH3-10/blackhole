using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json.Linq; // com.unity.nuget.newtonsoft-json
namespace GargantuaEdu
{
    /// Loads Resources/GargantuaEdu/Localization/<lang>.json. No educational sentence lives in C#.
    public class LocalizationService : MonoBehaviour
    {
        public static LocalizationService Instance { get; private set; }
        [SerializeField] string language = "en";
        JObject root;
        public System.Action OnLanguageChanged;

        void Awake() { Instance = this; Load(language); }
        public void SetLanguage(string lang) { language = lang; Load(lang); OnLanguageChanged?.Invoke(); }
        void Load(string lang)
        {
            var ta = Resources.Load<TextAsset>($"GargantuaEdu/Localization/{lang}") ?? Resources.Load<TextAsset>("GargantuaEdu/Localization/en");
            root = JObject.Parse(ta.text);
        }
        public string UI(string key) => (string)root["ui"]?[key] ?? key;
        public string ClassificationName(string c) => (string)root["classifications"]?[c] ?? c;
        public LabelEntry Label(string id) => root["labels"]?[id]?.ToObject<LabelEntry>();
        public List<LessonEntry> Lessons() => root["lessons"].ToObject<List<LessonEntry>>();
        public List<QuizEntry> Quiz() => root["quiz"].ToObject<List<QuizEntry>>();
        public List<ComparisonEntry> Comparison() => root["comparison"].ToObject<List<ComparisonEntry>>();
    }
}
