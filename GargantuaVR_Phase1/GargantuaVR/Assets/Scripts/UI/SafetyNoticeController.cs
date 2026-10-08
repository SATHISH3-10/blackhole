// Assets/Scripts/UI/SafetyNoticeController.cs
// PURPOSE: Startup safety and comfort notice + Seated/Standing mode onboarding screen.
using UnityEngine;
using UnityEngine.UI;
using Gargantua.Comfort;

namespace Gargantua.UI
{
    public class SafetyNoticeController : MonoBehaviour
    {
        public ComfortSettings comfort;
        public RecenterManager recenter;
        public GameObject noticePanel;
        public Button seatedButton;
        public Button standingButton;

        void Start()
        {
            if (seatedButton) seatedButton.onClick.AddListener(() => OnSelectMode(false));
            if (standingButton) standingButton.onClick.AddListener(() => OnSelectMode(true));

            // Position notice right in front of user on boot
            if (noticePanel != null)
            {
                Transform cam = Camera.main ? Camera.main.transform : transform;
                noticePanel.transform.position = cam.position + cam.forward * 1.5f;
                noticePanel.transform.rotation = Quaternion.LookRotation(cam.forward, Vector3.up);
                noticePanel.SetActive(true);
            }
        }

        void OnSelectMode(bool isStanding)
        {
            if (comfort != null)
            {
                comfort.standingMode = isStanding;
            }

            if (recenter != null)
            {
                recenter.Recenter();
            }

            if (noticePanel != null)
            {
                noticePanel.SetActive(false);
            }
        }
    }
}
