{
  const id = document.currentScript.getAttribute('data-eb-id');
  const elementBlockInfo = window.__smidyo__.elementBlocks[id];
  const measurementElement = document.getElementById(id + '-svg-measurements');
  const svgElement = document.getElementById(id + '-svg-preview');

  const update = () => {
    const payload = elementBlockInfo.payload;
    const showMeasurements = (payload['show-measurements'] || [null])[0];
    const overlayBoxWidth = (payload['overlay-box-width'] || [null])[0];
    const overlayBoxHeight = (payload['overlay-box-height'] || [null])[0];
    const previewSize = (payload['preview-size'] || [null])[0];

    if (previewSize) {
      svgElement.style.height = { small: '10rem', medium: '16rem', large: '22rem' }[
        previewSize
      ];
    }

    measurementElement.style.display = 'none';

    const svgPayload = payload.svg[0];
    window.__smidyo__.getPayloadletFileDownloadURLs([svgPayload.svg]).then(([urlInfo]) =>
      fetch(urlInfo.downloadURL).then(res =>
        res.text().then(svgBody => {
          svgElement.innerHTML = svgBody;
          const bbox = svgElement.getBBox();

          if (overlayBoxWidth && overlayBoxHeight) {
            const boxPath = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'path'
            );
            boxPath.setAttributeNS(null, 'id', id + '-measurement-box');
            boxPath.setAttributeNS(null, 'fill', 'white');
            boxPath.setAttributeNS(null, 'vector-effect', 'non-scaling-stroke');

            const overlayBoxOriginX = bbox.x - overlayBoxWidth / 2 + bbox.width / 2;
            const overlayBoxOriginY = bbox.y - overlayBoxHeight / 2 + bbox.height / 2;

            boxPath.setAttributeNS(
              null,
              'd',
              'M' +
                overlayBoxOriginX +
                ' ' +
                overlayBoxOriginY +
                ' L' +
                (overlayBoxOriginX + overlayBoxWidth) +
                ' ' +
                overlayBoxOriginY +
                ' L' +
                (overlayBoxOriginX + overlayBoxWidth) +
                ' ' +
                (overlayBoxOriginY + overlayBoxHeight) +
                ' L' +
                overlayBoxOriginX +
                ' ' +
                (overlayBoxOriginY + overlayBoxHeight) +
                ' Z'
            );
            svgElement.insertBefore(boxPath, svgElement.firstChild);

            const margin = overlayBoxHeight / 10;
            const viewBox =
              overlayBoxOriginX -
              margin +
              ' ' +
              (overlayBoxOriginY - margin) +
              ' ' +
              (overlayBoxWidth + margin * 2) +
              ' ' +
              (overlayBoxHeight + margin * 2);
            svgElement.setAttribute('viewBox', viewBox);
          } else {
            const margin = bbox.height / 10;
            const viewBox =
              bbox.x -
              margin +
              ' ' +
              (bbox.y - margin) +
              ' ' +
              (bbox.width + margin * 2) +
              ' ' +
              (bbox.height + margin * 2);
            svgElement.setAttribute('viewBox', viewBox);
          }

          if (showMeasurements) {
            measurementElement.innerHTML =
              bbox.width.toFixed(2) + ' × ' + bbox.height.toFixed(2);
            measurementElement.style.display = 'block';
          }

          elementBlockInfo.onResult({ 'viewed-svg': [svgPayload] });
        })
      )
    );
  };

  update();

  elementBlockInfo.update = update;
}
