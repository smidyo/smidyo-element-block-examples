//@ts-check
{
  const id = document.currentScript.getAttribute('data-eb-id');
  const elementBlockInfo = window['__smidyo__'].elementBlocks[id];
  const measurementElement = document.getElementById(id + '-svg-measurements');
  const previewElement = document.getElementById(id + '-svg-preview');
  const buttonContainer = document.getElementById(id + '-button-container');
  const nextButton = document.getElementById(id + '-button-next');
  const prevButton = document.getElementById(id + '-button-previous');
  const pageSpan = document.getElementById(id + '-page');

  const convertUnit = (measurement, from, to) => {
    const mm = {
      in: measurement * 25.4,
      cm: measurement * 10,
      mm: measurement,
      pt: measurement * 0.3527777778,
      px: measurement * 0.2645833333
    }[from];
    return {
      in: mm / 25.4,
      cm: mm / 10,
      mm,
      pt: mm / 0.3527777778,
      px: mm / 0.2645833333
    }[to];
  };

  const update = () => {
    const payload = elementBlockInfo.payload;
    const [showMeasurements] = payload['show-measurements'] || [null];
    const [previewSize] = payload['preview-size'] || [null];
    const [measurementUnit] = payload['measurement-unit'];
    const [overlayBoxWidth] = payload['overlay-box-width'] || [null];
    const [overlayBoxHeight] = payload['overlay-box-height'] || [null];

    if (previewSize) {
      previewElement.style.height = { small: '10rem', medium: '16rem', large: '22rem' }[
        previewSize
      ];
    }

    measurementElement.style.display = 'none';

    const svgsPayload = payload.svg;

    buttonContainer.style.display = svgsPayload.length > 1 ? 'block' : 'none';

    window['__smidyo__']
      .getPayloadletFileDownloadURLs(svgsPayload.map(s => s.svg))
      .then(async urlInfos => {
        const svgBodies = await Promise.all(
          urlInfos.map(u => fetch(u.downloadURL).then(res => res.text()))
        );

        let currentIndex = 0;
        const setCurrent = index => {
          currentIndex = index;
          //@ts-ignore
          prevButton.disabled = currentIndex === 0;
          //@ts-ignore
          nextButton.disabled = currentIndex === svgsPayload.length - 1;

          pageSpan.innerHTML = `${currentIndex + 1} / ${svgsPayload.length}`;
          const xmlVerIndex = svgBodies[index].indexOf('?>');
          const body =
            xmlVerIndex === -1
              ? svgBodies[index]
              : svgBodies[index].slice(xmlVerIndex + 2);
          previewElement.innerHTML = body;
          const innerSVG = previewElement.firstElementChild;
          //@ts-ignore
          innerSVG.style.width = '100%';
          //@ts-ignore
          innerSVG.style.height = '100%';

          //@ts-ignore
          const bbox = innerSVG.getBBox();

          const drawingUnit = svgsPayload[index].unit || 'mm';
          const bbWidth = convertUnit(overlayBoxWidth, measurementUnit, drawingUnit);
          const bbHeight = convertUnit(overlayBoxHeight, measurementUnit, drawingUnit);

          if (bbWidth && bbHeight) {
            const boxPath = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'path'
            );
            boxPath.setAttributeNS(null, 'id', id + '-measurement-box');
            boxPath.setAttributeNS(null, 'fill', 'white');
            boxPath.setAttributeNS(null, 'vector-effect', 'non-scaling-stroke');

            const overlayBoxOriginX = bbox.x - bbWidth / 2 + bbox.width / 2;
            const overlayBoxOriginY = bbox.y - bbHeight / 2 + bbox.height / 2;

            boxPath.setAttributeNS(
              null,
              'd',
              'M' +
                overlayBoxOriginX +
                ' ' +
                overlayBoxOriginY +
                ' L' +
                (overlayBoxOriginX + bbWidth) +
                ' ' +
                overlayBoxOriginY +
                ' L' +
                (overlayBoxOriginX + bbWidth) +
                ' ' +
                (overlayBoxOriginY + bbHeight) +
                ' L' +
                overlayBoxOriginX +
                ' ' +
                (overlayBoxOriginY + bbHeight) +
                ' Z'
            );
            innerSVG.insertBefore(boxPath, innerSVG.firstChild);

            const margin = bbHeight / 10;
            const viewBox =
              overlayBoxOriginX -
              margin +
              ' ' +
              (overlayBoxOriginY - margin) +
              ' ' +
              (bbWidth + margin * 2) +
              ' ' +
              (bbHeight + margin * 2);

            //@ts-ignore
            innerSVG.setAttribute('viewBox', viewBox);
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

            //@ts-ignore
            innerSVG.setAttribute('viewBox', viewBox);
          }

          if (showMeasurements) {
            measurementElement.innerHTML =
              convertUnit(bbox.width, drawingUnit, measurementUnit).toFixed(2) +
              ' × ' +
              convertUnit(bbox.height, drawingUnit, measurementUnit).toFixed(2) +
              ' ' +
              measurementUnit;
            measurementElement.style.display = 'block';
          }
        };

        nextButton.onclick = () => {
          setCurrent(currentIndex + 1);
        };
        prevButton.onclick = () => {
          setCurrent(currentIndex - 1);
        };

        setCurrent(0);

        elementBlockInfo.onResult({ 'viewed-svg': svgsPayload });
      });
  };

  update();

  elementBlockInfo.update = update;
}
