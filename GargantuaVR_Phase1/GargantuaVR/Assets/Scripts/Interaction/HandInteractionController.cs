// Assets/Scripts/Interaction/HandInteractionController.cs
// PURPOSE: Meta Interaction SDK & OVRHand gesture controller.
// Implements pinch to select, palm-up menu trigger, and 3D holographic model manipulation.
using UnityEngine;
using Gargantua.BlackHole;
using Gargantua.UI;

namespace Gargantua.Interaction
{
    public class HandInteractionController : MonoBehaviour
    {
        [Header("Hand Tracking Components")]
        public OVRHand leftHand;
        public OVRHand rightHand;
        public ParameterPanelController parameterPanel;
        public Transform holographicModel;

        [Header("Gesture Settings")]
        public float pinchThreshold = 0.75f;
        public float palmFacingHeadThreshold = 0.65f;
        public float minScale = 0.2f;
        public float maxScale = 3.0f;

        bool leftPinchingLast;
        bool rightPinchingLast;
        bool isTwoHandScaling;
        float initialHandDistance;
        Vector3 initialModelScale;
        Quaternion lastGrabRotation;
        bool isGrabbingModel;

        void Update()
        {
            HandlePalmMenuGesture();
            HandlePinchInteractions();
            HandleHologramManipulation();
        }

        void HandlePalmMenuGesture()
        {
            if (leftHand == null || !leftHand.IsTracked || parameterPanel == null) return;

            // Check if left palm is facing user head
            Transform head = Camera.main ? Camera.main.transform : null;
            if (head == null) return;

            Vector3 palmNormal = -leftHand.transform.up; // Standard OVRHand palm normal
            Vector3 toHead = (head.position - leftHand.transform.position).normalized;

            float alignment = Vector3.Dot(palmNormal, toHead);
            if (alignment > palmFacingHeadThreshold && !parameterPanel.IsOpen)
            {
                parameterPanel.OpenPanelNearHand(leftHand.transform.position + Vector3.up * 0.15f);
            }
        }

        void HandlePinchInteractions()
        {
            if (rightHand != null && rightHand.IsTracked)
            {
                bool isPinching = rightHand.GetFingerIsPinching(OVRHand.HandFinger.Index);
                float pinchStrength = rightHand.GetFingerPinchStrength(OVRHand.HandFinger.Index);

                if (isPinching && pinchStrength >= pinchThreshold && !rightPinchingLast)
                {
                    // Pinch Down - Cast ray from index tip
                    RaycastPinch(rightHand.PointerPose ? rightHand.PointerPose : rightHand.transform);
                }
                rightPinchingLast = isPinching;
            }
        }

        void RaycastPinch(Transform pointer)
        {
            Ray ray = new Ray(pointer.position, pointer.forward);
            if (Physics.Raycast(ray, out RaycastHit hit, 5.0f))
            {
                var interactable = hit.collider.GetComponent<IHandInteractable>();
                if (interactable != null)
                {
                    interactable.OnHandPinch(hit.point);
                }
            }
        }

        void HandleHologramManipulation()
        {
            if (holographicModel == null || leftHand == null || rightHand == null) return;
            if (!leftHand.IsTracked || !rightHand.IsTracked) return;

            bool leftPinch = leftHand.GetFingerIsPinching(OVRHand.HandFinger.Index);
            bool rightPinch = rightHand.GetFingerIsPinching(OVRHand.HandFinger.Index);

            // Two-hand pinch for scaling
            if (leftPinch && rightPinch)
            {
                float currentDist = Vector3.Distance(leftHand.transform.position, rightHand.transform.position);
                if (!isTwoHandScaling)
                {
                    isTwoHandScaling = true;
                    initialHandDistance = currentDist;
                    initialModelScale = holographicModel.localScale;
                }
                else if (initialHandDistance > 0.01f)
                {
                    float factor = currentDist / initialHandDistance;
                    Vector3 newScale = initialModelScale * factor;
                    float clampedScale = Mathf.Clamp(newScale.x, minScale, maxScale);
                    holographicModel.localScale = Vector3.one * clampedScale;
                }
            }
            else
            {
                isTwoHandScaling = false;

                // Single hand pinch for rotation
                if (rightPinch)
                {
                    if (!isGrabbingModel)
                    {
                        isGrabbingModel = true;
                        lastGrabRotation = rightHand.transform.rotation;
                    }
                    else
                    {
                        Quaternion deltaRot = rightHand.transform.rotation * Quaternion.Inverse(lastGrabRotation);
                        holographicModel.rotation = deltaRot * holographicModel.rotation;
                        lastGrabRotation = rightHand.transform.rotation;
                    }
                }
                else
                {
                    isGrabbingModel = false;
                }
            }
        }
    }

    public interface IHandInteractable
    {
        void OnHandPinch(Vector3 hitPoint);
    }
}
