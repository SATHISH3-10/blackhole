# Gargantua VR: Setup & Build Guide

## 1. Prerequisites
* **Unity 2022.3 LTS** (or 2023.2 LTS).
* **Android Build Support** (with Android SDK & NDK installed via Unity Hub).
* **Meta Quest Developer Hub (MQDH)** or ADB for sideloading.

## 2. Project Settings Configuration
1. Open **Project Settings > XR Plug-in Management**:
   * Enable **Oculus / Meta XR** for Android and Standalone platforms.
2. In **Meta XR settings**:
   * Set **Target Devices**: Quest 2, Quest 3, Quest 3S, Quest Pro.
   * Set **Color Space**: Linear.
   * Enable **Hand Tracking Support**: Hands and Controllers.
   * Enable **Eye Tracking Support**: Supported (Optional permission).
3. In **Quality Settings**:
   * Ensure URP Asset is assigned.
   * Set MSAA to 2x or 4x (for crisp VR edges).

## 3. Scene Setup
1. In the Unity Editor menu bar, click **`Gargantua > Create Main Scene`**.
2. This creates and saves `Assets/Scenes/GargantuaMain.unity` with all components pre-wired.
3. Open `File > Build Settings...` and add `GargantuaMain.unity` to Scenes in Build.

## 4. Building for Meta Quest (APK)
1. In **Build Settings**, select **Android** and click **Switch Platform**.
2. Set **Texture Compression** to ASTC.
3. Connect your Meta Quest headset via USB-C with Developer Mode enabled.
4. Click **Build and Run** to package and launch the application directly on your headset.
