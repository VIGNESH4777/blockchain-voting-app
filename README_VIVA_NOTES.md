# Face Verification Viva Notes

This document contains key notes regarding the face verification implementation in this Voting dApp to help you prepare for your viva questions.

## Core Library Used
**library:** `face-api.js`
- It is a JavaScript API built on top of `tensorflow.js` core, enabling face detection and face recognition directly in the browser without sending images to a backend server.

---

## 1. Face Detection Model
**Model Name:** `Tiny Face Detector` (`tinyFaceDetector`)
- **What it does:** It is responsible for locating the face within the webcam feed or the reference image. It draws a bounding box around where it thinks a face is.
- **Why we chose it:** It is a very lightweight, fast, and resource-efficient model designed for real-time face detection on web and mobile devices. It is faster than the standard SSD Mobilenet V1 model, albeit slightly less accurate under extreme conditions.
- **How we tuned it:** We adjusted `inputSize` to `512` (to allow it to see higher resolution details) and lowered the `scoreThreshold` to `0.3` (to make it a bit more lenient in recognizing faces in different lighting or angles).

## 2. Face Landmark Detection Model
**Model Name:** `68 Point Face Landmark Detector` (`faceLandmark68Net`)
- **What it does:** Once a face is found by the detector, this model identifies 68 specific points (landmarks) on the human face (e.g., the corners of the eyes, the tip of the nose, the outline of the lips and jaw).
- **Why we use it:** Aligning the face based on these precise points is a crucial intermediate step required before the system can accurately recognize or compare who the person is.

## 3. Face Recognition Model
**Model Name:** `Face Recognition Network` (`faceRecognitionNet`)
- **What it does:** It takes the aligned face (using the 68 landmarks) and computes a **Face Descriptor**.
- **What is a Face Descriptor?** It is a mathematical representation of the face—specifically, an array of 128 numbers (a 128-dimensional vector) that uniquely identifies the person's facial features.
- **How verification works:** 
  1. We generate a 128-d descriptor for the face in the live webcam feed.
  2. We generate a 128-d descriptor for the stored reference photo.
  3. We calculate the **Euclidean Distance** between these two mathematical vectors. 
  4. If the distance is less than `0.6` (the standard threshold), the system considers it a "Match". If it is greater, the verification fails.

---

## Possible Viva Questions & Answers

**Q: Why do Face Verification on the frontend instead of the backend?**
A: By using `face-api.js` in the browser, the webcam feed is processed locally on the user's device. This improves privacy because raw video streams don't need to be sent over the network, and it reduces the load on the backend server.

**Q: What happens if the lighting is bad or the user moves?**
A: The system relies on the `Tiny Face Detector`. If lighting is extremely poor, the model's confidence may drop below our `0.3` threshold, causing a "No face detected" error. 

**Q: How does the system compare two faces?**
A: It calculates the Euclidean distance between two 128-dimensional face descriptors. A smaller distance means the faces are highly similar; a larger distance means they are different people.

**Q: Is it robust against spoofing (e.g., holding up a photo)?**
A: Currently, this basic implementation verifies facial similarity but does not include sophisticated "liveness detection" (like asking the user to blink or turn their head). Adding liveness detection would be the next step for a production-grade system.
