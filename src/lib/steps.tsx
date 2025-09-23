import { Tour } from 'nextstepjs';

export const steps: Tour[] = [
  {
    tour: "mainTour",
    steps: [
      {
        icon: "👋",
        title: "Welcome",
        content: "Click to draw a rectangle in canvas!",
        selector: "#step1",
        side: "right",
        pointerPadding: 4,    // Padding around the target element (in pixels)
        pointerRadius: 4,      // Border radius of the pointer (in pixels)
        showControls: true,
        showSkip: true
      },
      {
        icon: "👋",
        title: "Welcome",
        content: "Click to draw a polygon in canvas!",
        selector: "#step2",
        side: "bottom",
        pointerPadding: 4,    // Padding around the target element (in pixels)
        pointerRadius: 4,      // Border radius of the pointer (in pixels)
        showControls: true,
        showSkip: true
      },
      {
        icon: "👋",
        title: "Welcome",
        content: "Click to select whole area in canvas!",
        selector: "#step3",
        side: "right",
        pointerPadding: 4,    // Padding around the target element (in pixels)
        pointerRadius: 4,      // Border radius of the pointer (in pixels)
        showControls: true,
        showSkip: true
      },
      // More steps...
    ]
  }
];