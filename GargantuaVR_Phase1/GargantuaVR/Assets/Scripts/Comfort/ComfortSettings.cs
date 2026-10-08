// Assets/Scripts/Comfort/ComfortSettings.cs
// PURPOSE: Comfort/accessibility settings shared by input, observer movement and body.
// Only fields that are actually consumed in code exist here (no dead settings).
using UnityEngine;

namespace Gargantua.Comfort
{
    public enum PlayMode { Seated, Standing }

    [CreateAssetMenu(fileName = "ComfortSettings", menuName = "Gargantua/Comfort Settings")]
    public class ComfortSettings : ScriptableObject
    {
        public PlayMode mode = PlayMode.Seated;
        public bool bodyVisible = true;
        public bool leftHanded = false;                       // swaps move/turn sticks

        [Header("Turning (never forced)")]
        public bool snapTurn = true;
        [Range(15f, 90f)] public float snapAngleDeg = 30f;
        [Range(10f, 120f)] public float smoothTurnDegPerSec = 45f;

        [Header("Observer movement (slow by default, never forced)")]
        public bool movementEnabled = true;
        [Range(0.2f, 6f)] public float maxDistanceSpeedGMPerSec = 2f;
        [Range(2f, 40f)] public float maxOrbitSpeedDegPerSec = 10f;
        [Range(0.1f, 0.5f)] public float stickDeadzone = 0.2f;
    }
}
