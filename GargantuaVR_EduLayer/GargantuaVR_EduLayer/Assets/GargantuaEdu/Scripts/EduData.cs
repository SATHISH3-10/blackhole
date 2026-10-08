using System;
using System.Collections.Generic;
namespace GargantuaEdu
{
    [Serializable] public class LabelEntry { public string title, simple, advanced, equation, classification, limitation; }
    [Serializable] public class LessonEntry { public string id, title, simple, advanced, classification, audioKey; public string[] labels; public float durationSec; }
    [Serializable] public class QuizEntry { public string id, question, explanation; public string[] options; public int correct; }
    [Serializable] public class ComparisonEntry { public string id, title, text, limit; }
    [Serializable] public class ParameterEntry { public string id, name, symbol, unit, classification; public float min, max, @default; }
    [Serializable] public class ParameterList { public List<ParameterEntry> items = new List<ParameterEntry>(); }
}
