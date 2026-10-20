# Known limitations

- wide-arc illustration squashed by uniform scale — fix is to preserve the aspect ratio encoded in the viewBox, deferred. Health-medical slide 6 draws its blue floor as a circle about 359px wide because the path is a circle in a 1600×359 box and the renderer scales illustrations with `min(width/viewBoxW, height/viewBoxH)`. The original floor is a wide shallow arc.
