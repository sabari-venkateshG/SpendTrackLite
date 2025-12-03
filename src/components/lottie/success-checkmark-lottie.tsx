'use client';

import Lottie from "lottie-react";

// Animation by Weijie on Lottiefiles: https://lottiefiles.com/animations/success-checkmark-0i1oJz3t4a
const animationData = {
  "v": "5.5.2",
  "fr": 30,
  "ip": 0,
  "op": 75,
  "w": 512,
  "h": 512,
  "nm": "success_checkmark",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "check",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100, "ix": 11 },
        "r": { "a": 0, "k": 0, "ix": 10 },
        "p": { "a": 0, "k": [256, 256, 0], "ix": 2 },
        "a": { "a": 0, "k": [0, 0, 0], "ix": 1 },
        "s": { "a": 0, "k": [100, 100, 100], "ix": 6 }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "shape",
              "ks": {
                "a": 0,
                "k": {
                  "i": [[0, 0], [0, 0]],
                  "o": [[0, 0], [0, 0]],
                  "v": [[-96, -11], [1, 79], [121, -82]],
                  "c": false
                },
                "ix": 2
              },
              "nm": "Path 1",
              "mn": "ADBE Vector Shape - Group",
              "hd": false
            },
            {
              "ty": "st",
              "c": { "a": 0, "k": [0, 0.631, 0.369, 1], "ix": 3 },
              "o": { "a": 0, "k": 100, "ix": 4 },
              "w": { "a": 0, "k": 20, "ix": 5 },
              "lc": 2,
              "lj": 2,
              "ml": 4,
              "bm": 0,
              "mn": "ADBE Vector Graphic - Stroke",
              "hd": false
            },
            {
              "ty": "tm",
              "s": { "a": 0, "k": 0, "ix": 1 },
              "e": {
                "a": 1,
                "k": [
                  { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 20, "s": [0] },
                  { "t": 35, "s": [100] }
                ],
                "ix": 2
              },
              "o": { "a": 0, "k": 0, "ix": 3 },
              "m": 1,
              "ix": 2,
              "nm": "Trim Paths 1"
            }
          ],
          "nm": "Group 1",
          "np": 3,
          "cix": 2,
          "bm": 0,
          "ix": 1,
          "mn": "ADBE Vector Group",
          "hd": false
        }
      ],
      "ip": 0,
      "op": 75,
      "st": 0,
      "bm": 0
    },
    {
      "ddd": 0,
      "ind": 2,
      "ty": 4,
      "nm": "circle",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100, "ix": 11 },
        "r": { "a": 0, "k": 0, "ix": 10 },
        "p": { "a": 0, "k": [256, 256, 0], "ix": 2 },
        "a": { "a": 0, "k": [0, 0, 0], "ix": 1 },
        "s": { "a": 0, "k": [100, 100, 100], "ix": 6 }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ind": 0,
              "ty": "el",
              "ix": 1,
              "ks": {
                "s": { "a": 0, "k": [300, 300], "ix": 2 },
                "p": { "a": 0, "k": [0, 0], "ix": 2 }
              },
              "nm": "Ellipse Path 1",
              "mn": "ADBE Vector Shape - Ellipse",
              "hd": false
            },
            {
              "ty": "st",
              "c": { "a": 0, "k": [0, 0.631, 0.369, 1], "ix": 3 },
              "o": { "a": 0, "k": 100, "ix": 4 },
              "w": { "a": 0, "k": 20, "ix": 5 },
              "lc": 1,
              "lj": 1,
              "ml": 4,
              "bm": 0,
              "mn": "ADBE Vector Graphic - Stroke",
              "hd": false
            },
            {
              "ty": "tm",
              "s": { "a": 0, "k": 0, "ix": 1 },
              "e": {
                "a": 1,
                "k": [
                  { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 0, "s": [0] },
                  { "t": 20, "s": [100] }
                ],
                "ix": 2
              },
              "o": { "a": 0, "k": 0, "ix": 3 },
              "m": 1,
              "ix": 2,
              "nm": "Trim Paths 1"
            }
          ],
          "nm": "Ellipse 1",
          "np": 3,
          "cix": 2,
          "bm": 0,
          "ix": 1,
          "mn": "ADBE Vector Group",
          "hd": false
        }
      ],
      "ip": 0,
      "op": 75,
      "st": 0,
      "bm": 0
    }
  ],
  "markers": []
};

export const SuccessCheckmarkLottie = () => {
    return <Lottie animationData={animationData} loop={false} style={{width: 64, height: 64}} />;
};
