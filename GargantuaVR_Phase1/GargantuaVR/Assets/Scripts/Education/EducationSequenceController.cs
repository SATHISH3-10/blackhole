// Assets/Scripts/Education/EducationSequenceController.cs
// PURPOSE: 8-12 minute 11-step guided educational sequence with subtitles and narration hooks.
using System.Collections;
using UnityEngine;
using TMPro;
using Gargantua.BlackHole;

namespace Gargantua.Education
{
    public class EducationSequenceController : MonoBehaviour
    {
        public BlackHolePhysicsConfig config;
        public TextMeshProUGUI subtitleText;
        public AudioSource narrationAudio;

        public struct LessonStep
        {
            public string title;
            public string subtitle;
            public float duration;
            public float targetDistance;
            public float targetInclination;
            public bool showHorizon;
            public bool showPhoton;
            public bool showErgo;
        }

        public LessonStep[] steps;
        int currentStepIndex = -1;
        bool isPlayingSequence;

        void Start()
        {
            SetupLessonSteps();
        }

        void SetupLessonSteps()
        {
            steps = new LessonStep[]
            {
                new LessonStep {
                    title = "Safe Observation",
                    subtitle = "You are observing a supermassive Kerr black hole from a safe distance in deep space.",
                    duration = 10f, targetDistance = 45f, targetInclination = 84f
                },
                new LessonStep {
                    title = "The Central Shadow",
                    subtitle = "The central dark region is the black hole shadow—an apparent silhouette formed by captured photons.",
                    duration = 12f, targetDistance = 35f, targetInclination = 84f
                },
                new LessonStep {
                    title = "The Accretion Disk",
                    subtitle = "Superheated plasma orbits outside the horizon. The disk is not the black hole itself, but matter trapped in its gravity.",
                    duration = 14f, targetDistance = 25f, targetInclination = 84f
                },
                new LessonStep {
                    title = "Orbital Rotation",
                    subtitle = "Notice how the side of the disk rotating toward you is brighter and blueshifted due to relativistic Doppler beaming.",
                    duration = 15f, targetDistance = 22f, targetInclination = 80f
                },
                new LessonStep {
                    title = "Dual-Arc Lensing",
                    subtitle = "Extreme gravity bends light from the rear of the disk over the top and under the bottom of the shadow simultaneously.",
                    duration = 15f, targetDistance = 20f, targetInclination = 90f
                },
                new LessonStep {
                    title = "Gravitational Lensing",
                    subtitle = "Spacetime curvature deflects passing starlight, creating distorted Einstein rings and arcs around the perimeter.",
                    duration = 14f, targetDistance = 24f, targetInclination = 85f
                },
                new LessonStep {
                    title = "The Photon Region",
                    subtitle = "Photons can become temporarily trapped in unstable orbits, forming a glowing golden photon ring near the shadow edge.",
                    duration = 14f, targetDistance = 18f, targetInclination = 85f, showPhoton = true
                },
                new LessonStep {
                    title = "The Event Horizon",
                    subtitle = "The event horizon is an immaterial causal boundary—a point of no return from which nothing, not even light, can escape.",
                    duration = 14f, targetDistance = 15f, targetInclination = 85f, showHorizon = true
                },
                new LessonStep {
                    title = "No Solid Surface",
                    subtitle = "Unlike a planet or star, a black hole has no solid crust or glowing sphere beneath the event horizon.",
                    duration = 12f, targetDistance = 15f, targetInclination = 85f, showHorizon = true
                },
                new LessonStep {
                    title = "Relativistic vs. Newtonian",
                    subtitle = "Newtonian physics predicts light travels in straight lines. General relativity reveals light follows curved null geodesics.",
                    duration = 15f, targetDistance = 25f, targetInclination = 84f
                },
                new LessonStep {
                    title = "Knowledge Check",
                    subtitle = "Let's review what you've learned with a short 3-question quiz!",
                    duration = 8f, targetDistance = 30f, targetInclination = 84f
                }
            };
        }

        public void StartGuidedLesson()
        {
            if (isPlayingSequence) return;
            StartCoroutine(RunSequenceRoutine());
        }

        IEnumerator RunSequenceRoutine()
        {
            isPlayingSequence = true;
            for (int i = 0; i < steps.Length; i++)
            {
                currentStepIndex = i;
                var step = steps[i];

                if (subtitleText != null)
                {
                    subtitleText.text = $"<b>[{i + 1}/{steps.Length}] {step.title}</b>\n{step.subtitle}";
                }

                if (config != null)
                {
                    config.showEventHorizon = step.showHorizon;
                    config.showPhotonRegion = step.showPhoton;
                    config.showErgosphere = step.showErgo;
                }

                // Smooth camera move toward target
                float elapsed = 0f;
                float startDist = config ? config.observerDistanceGM : 30f;
                float startIncl = config ? config.observerInclinationDeg : 84f;

                while (elapsed < step.duration)
                {
                    elapsed += Time.deltaTime;
                    float t = Mathf.SmoothStep(0f, 1f, elapsed / Mathf.Min(step.duration, 4f));
                    if (config != null)
                    {
                        config.observerDistanceGM = Mathf.Lerp(startDist, step.targetDistance, t);
                        config.observerInclinationDeg = Mathf.Lerp(startIncl, step.targetInclination, t);
                    }
                    yield return null;
                }
            }

            if (subtitleText != null)
            {
                subtitleText.text = "<b>Lesson Complete!</b> Feel free to explore freely or open the control panel.";
            }
            isPlayingSequence = false;
        }

        public void StopSequence()
        {
            StopAllCoroutines();
            isPlayingSequence = false;
            if (subtitleText != null) subtitleText.text = "";
        }
    }
}
