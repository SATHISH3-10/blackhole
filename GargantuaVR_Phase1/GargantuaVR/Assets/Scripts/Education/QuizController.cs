// Assets/Scripts/Education/QuizController.cs
// PURPOSE: In-VR interactive knowledge check quiz evaluating black hole physics concepts.
using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace Gargantua.Education
{
    public class QuizController : MonoBehaviour
    {
        public GameObject quizPanel;
        public TextMeshProUGUI questionText;
        public Button[] optionButtons;
        public TextMeshProUGUI[] optionTexts;
        public TextMeshProUGUI feedbackText;

        [Serializable]
        public struct QuizQuestion
        {
            public string question;
            public string[] options;
            public int correctIndex;
            public string explanation;
        }

        public QuizQuestion[] questions;
        int currentQuestionIndex;

        void Start()
        {
            SetupQuestions();
            for (int i = 0; i < optionButtons.Length; i++)
            {
                int idx = i;
                optionButtons[i].onClick.AddListener(() => OnSelectAnswer(idx));
            }
        }

        void SetupQuestions()
        {
            questions = new QuizQuestion[]
            {
                new QuizQuestion
                {
                    question = "Why does the top of the accretion disk appear above the black hole?",
                    options = new string[] {
                        "A) Gravity bends light from the far side over the top of the hole",
                        "B) The disk is physically wrapped in a sphere around the hole",
                        "C) The black hole is glowing from inside"
                    },
                    correctIndex = 0,
                    explanation = "Correct! Extreme gravitational lensing bends light rays from the rear disk over the top of the event horizon."
                },
                new QuizQuestion
                {
                    question = "Is the black hole shadow the same as the event horizon?",
                    options = new string[] {
                        "A) Yes, they are identical in size",
                        "B) No, the shadow is an apparent optical silhouette ~2.6x larger than the horizon",
                        "C) No, the shadow is smaller than the horizon"
                    },
                    correctIndex = 1,
                    explanation = "Correct! The shadow is an apparent dark silhouette formed by photon capture, appearing significantly larger than the event horizon coordinate radius."
                },
                new QuizQuestion
                {
                    question = "Why is one side of the accretion disk brighter than the other?",
                    options = new string[] {
                        "A) Stars behind that side are brighter",
                        "B) Relativistic Doppler beaming boosts radiation moving toward the observer",
                        "C) The black hole has a physical shadow on one side"
                    },
                    correctIndex = 1,
                    explanation = "Correct! Orbital velocities approaching the speed of light cause Doppler boosting in the direction of motion."
                }
            };
        }

        public void OpenQuiz()
        {
            currentQuestionIndex = 0;
            if (quizPanel != null) quizPanel.SetActive(true);
            DisplayQuestion(0);
        }

        void DisplayQuestion(int index)
        {
            if (index >= questions.Length)
            {
                if (questionText != null) questionText.text = "<b>Quiz Complete!</b> Excellent understanding of Kerr black hole physics.";
                if (feedbackText != null) feedbackText.text = "";
                for (int i = 0; i < optionButtons.Length; i++) optionButtons[i].gameObject.SetActive(false);
                return;
            }

            var q = questions[index];
            if (questionText != null) questionText.text = $"<b>Question {index + 1}/{questions.Length}</b>\n{q.question}";
            if (feedbackText != null) feedbackText.text = "";

            for (int i = 0; i < optionButtons.Length; i++)
            {
                if (i < q.options.Length)
                {
                    optionButtons[i].gameObject.SetActive(true);
                    if (optionTexts[i] != null) optionTexts[i].text = q.options[i];
                }
                else
                {
                    optionButtons[i].gameObject.SetActive(false);
                }
            }
        }

        void OnSelectAnswer(int selectedIndex)
        {
            var q = questions[currentQuestionIndex];
            if (selectedIndex == q.correctIndex)
            {
                if (feedbackText != null) feedbackText.text = $"<color=#00FF9D>{q.explanation}</color>";
                currentQuestionIndex++;
                Invoke(nameof(NextQuestion), 2.5f);
            }
            else
            {
                if (feedbackText != null) feedbackText.text = "<color=#FF5555>Not quite. Try another answer!</color>";
            }
        }

        void NextQuestion()
        {
            DisplayQuestion(currentQuestionIndex);
        }
    }
}
