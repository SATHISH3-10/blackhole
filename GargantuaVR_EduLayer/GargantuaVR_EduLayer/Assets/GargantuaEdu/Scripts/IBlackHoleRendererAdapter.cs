namespace GargantuaEdu
{
    /// Integration seam. Implement once against the existing Gargantua renderer (shader properties / material),
    /// so the educational layer never touches renderer internals. Keys match Data/parameters.json ids.
    public interface IBlackHoleRendererAdapter
    {
        void SetParameter(string id, float value);
        float GetParameter(string id);
        void SetOverlay(string labelId, bool visible); // e.g. "SHADOW", "EVENT_HORIZON", "PHOTON_REGION"
        void SetRenderMode(int mode);                  // 0 Newtonian ref, 1 approximation, 2 high quality (if any)
        void FocusCamera(float distanceGM, float inclinationDeg); // must use fade, never forced rapid motion
    }
}
