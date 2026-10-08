// Assets/Scripts/Core/SaveSettingsController.cs
// PURPOSE: Persist physics + comfort settings as JSON under Application.persistentDataPath. No eye/tracking data is stored.
using System.IO;
using UnityEngine;
using Gargantua.BlackHole;
using Gargantua.Comfort;

namespace Gargantua.Core
{
    public class SaveSettingsController : MonoBehaviour
    {
        public BlackHolePhysicsConfig config; public ComfortSettings comfort;
        string P(string n) => Path.Combine(Application.persistentDataPath, n);

        public void Load()
        {
            try
            {
                if (File.Exists(P("physics.json"))) JsonUtility.FromJsonOverwrite(File.ReadAllText(P("physics.json")), config);
                if (File.Exists(P("comfort.json"))) JsonUtility.FromJsonOverwrite(File.ReadAllText(P("comfort.json")), comfort);
            }
            catch (System.Exception e) { Debug.LogWarning("Settings load failed: " + e.Message); }
        }

        public void Save()
        {
            try { File.WriteAllText(P("physics.json"), JsonUtility.ToJson(config, true)); File.WriteAllText(P("comfort.json"), JsonUtility.ToJson(comfort, true)); }
            catch (System.Exception e) { Debug.LogWarning("Settings save failed: " + e.Message); }
        }

        void OnApplicationPause(bool p) { if (p) Save(); }
        void OnApplicationQuit() { Save(); }
    }
}
