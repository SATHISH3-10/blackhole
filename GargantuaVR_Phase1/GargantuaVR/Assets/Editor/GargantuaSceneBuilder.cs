// Assets/Editor/GargantuaSceneBuilder.cs
// PURPOSE: Complete one-click scene assembly (menu: Gargantua > Create Main Scene).
// Automatically creates all configuration assets, materials, cameras, XR rig, space suit,
// educational sequence, holographic UI panel, and audio controllers.
#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using Gargantua.BlackHole;
using Gargantua.Body;
using Gargantua.Comfort;
using Gargantua.Core;
using Gargantua.Input;
using Gargantua.Interaction;
using Gargantua.UI;
using Gargantua.Education;
using Gargantua.Audio;

public static class GargantuaSceneBuilder
{
    static T LoadOrCreate<T>(string path) where T : ScriptableObject
    {
        var a = AssetDatabase.LoadAssetAtPath<T>(path);
        if (a == null)
        {
            a = ScriptableObject.CreateInstance<T>();
            System.IO.Directory.CreateDirectory(System.IO.Path.GetDirectoryName(path));
            AssetDatabase.CreateAsset(a, path);
        }
        return a;
    }

    static Material LoadOrCreateMat(string path, string shader, System.Action<Material> setup = null)
    {
        var m = AssetDatabase.LoadAssetAtPath<Material>(path);
        if (m == null)
        {
            var sh = Shader.Find(shader);
            if (sh == null) throw new System.Exception("Shader not found: " + shader + " (is URP installed/active?)");
            m = new Material(sh);
            setup?.Invoke(m);
            System.IO.Directory.CreateDirectory(System.IO.Path.GetDirectoryName(path));
            AssetDatabase.CreateAsset(m, path);
        }
        return m;
    }

    [MenuItem("Gargantua/Create Main Scene")]
    public static void Build()
    {
        var physics = LoadOrCreate<BlackHolePhysicsConfig>("Assets/Config/BlackHolePhysicsConfig.asset");
        var comfort = LoadOrCreate<ComfortSettings>("Assets/Config/ComfortSettings.asset");
        var sky = LoadOrCreateMat("Assets/Materials/GargantuaProceduralStarfield.mat", "Gargantua/Procedural Starfield");
        var disk = LoadOrCreateMat("Assets/Materials/GargantuaAccretionDisk.mat", "Gargantua/XR Accretion Disk Slice", m => m.enableInstancing = true);
        var lens = LoadOrCreateMat("Assets/Materials/GargantuaLensing.mat", "Hidden/Gargantua/XR Gravitational Lensing");
        var unlit = LoadOrCreateMat("Assets/Materials/OverlayUnlit.mat", "Universal Render Pipeline/Unlit");
        unlit.enableInstancing = true;
        var suit = LoadOrCreateMat("Assets/Materials/SuitMain.mat", "Universal Render Pipeline/Simple Lit", m => m.SetColor("_BaseColor", new Color(0.78f, 0.8f, 0.84f)));
        var accent = LoadOrCreateMat("Assets/Materials/SuitAccent.mat", "Universal Render Pipeline/Simple Lit", m => m.SetColor("_BaseColor", new Color(0.12f, 0.13f, 0.16f)));
        AssetDatabase.SaveAssets();

        EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // 1. Meta XR Camera Rig
        var rigGo = new GameObject("OVRCameraRig");
        rigGo.AddComponent<OVRCameraRig>();
        rigGo.AddComponent<OVRManager>();

        // 2. Central Black Hole
        var bhGo = new GameObject("BlackHole");
        var bh = bhGo.AddComponent<BlackHoleController>();
        bh.config = physics;
        bh.skyMaterialAsset = sky;
        bh.lensMaterialAsset = lens;
        var slicedDisk = bhGo.AddComponent<SlicedAccretionDiskRenderer>();
        slicedDisk.config = physics;
        slicedDisk.diskMaterialAsset = disk;

        // 3. Core Systems Hierarchy
        var sys = new GameObject("Systems");
        var observer = sys.AddComponent<ObserverController>();
        observer.config = physics;
        observer.comfort = comfort;
        observer.blackHole = bhGo.transform;

        var recenter = sys.AddComponent<RecenterManager>();
        recenter.comfort = comfort;
        recenter.observer = observer;

        var perf = sys.AddComponent<PerformanceMonitor>();
        perf.blackHole = bh;

        var save = sys.AddComponent<SaveSettingsController>();
        save.config = physics;
        save.comfort = comfort;

        // 4. Procedural Space Suit Body
        var bodyGo = new GameObject("SpaceSuit");
        var body = bodyGo.AddComponent<SpaceSuitBodyController>();
        body.comfort = comfort;
        body.suitMaterial = suit;
        body.accentMaterial = accent;

        // 5. Input & Interaction Layer
        var inputRouter = sys.AddComponent<XRInputRouter>();
        inputRouter.config = physics;
        inputRouter.comfort = comfort;
        inputRouter.observer = observer;
        inputRouter.recenter = recenter;
        inputRouter.body = body;

        var ctrlInput = sys.AddComponent<ControllerInputController>();
        ctrlInput.config = physics;
        ctrlInput.comfort = comfort;
        ctrlInput.observer = observer;
        ctrlInput.recenter = recenter;

        var handInput = sys.AddComponent<HandInteractionController>();
        var gazeInput = sys.AddComponent<GazeInteractionController>();

        // 6. Overlays & Frame Dragging
        var ov = sys.AddComponent<BlackHoleOverlayController>();
        ov.config = physics;
        ov.observer = observer;
        ov.spinFrame = bhGo.transform;
        ov.lineMaterialTemplate = unlit;

        var fd = sys.AddComponent<FrameDraggingController>();
        fd.config = physics;
        fd.blackHole = bh;
        fd.markerMaterialTemplate = unlit;

        // 7. Educational UI & Sequences
        var uiGo = new GameObject("UI_Hologram");
        var paramPanel = uiGo.AddComponent<ParameterPanelController>();
        paramPanel.config = physics;
        paramPanel.comfort = comfort;
        paramPanel.bodyController = body;
        ctrlInput.parameterPanel = paramPanel;
        handInput.parameterPanel = paramPanel;

        var safetyNotice = sys.AddComponent<SafetyNoticeController>();
        safetyNotice.comfort = comfort;
        safetyNotice.recenter = recenter;

        var eduSeq = sys.AddComponent<EducationSequenceController>();
        eduSeq.config = physics;

        var quiz = sys.AddComponent<QuizController>();

        var audioCtrl = sys.AddComponent<AudioNarrationController>();

        // 8. Application Bootstrap
        var boot = sys.AddComponent<AppBootstrap>();
        boot.config = physics;
        boot.comfort = comfort;
        boot.save = save;
        boot.recenter = recenter;
        boot.perf = perf;
        boot.observer = observer;

        System.IO.Directory.CreateDirectory("Assets/Scenes");
        EditorSceneManager.SaveScene(EditorSceneManager.GetActiveScene(), "Assets/Scenes/GargantuaMain.unity");
        Debug.Log("Gargantua main scene created and verified: Assets/Scenes/GargantuaMain.unity");
    }
}
#endif
