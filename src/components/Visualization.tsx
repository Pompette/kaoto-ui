import * as React from 'react';
import { Circle, Group, Image, Layer, Line, Stage, Text } from 'react-konva';
import { IStepProps, IViewProps, IVizStepProps } from '../types';
import createImage from '../utils/createImage';
import { StepView } from './StepView';
import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
} from '@patternfly/react-core';
import './Visualization.css';
import Konva from 'konva';
import { v4 as uuidv4 } from 'uuid';

interface IVisualization {
  isError?: boolean;
  isLoading?: boolean;
  steps: {viz: IVizStepProps, model: IStepProps}[];
  views: IViewProps[];
}

const CIRCLE_LENGTH = 75;

function truncateString(str, num) {
  if (str.length > num) {
    return str.slice(0, num) + '..';
  } else {
    return str;
  }
}

const placeholderStep = {
  model: {
    apiVersion: '',
    icon: '',
    id: '',
    name: '',
    type: '',
    UUID: ''
  },
  viz: {
    data: {
      label: ''
    },
    id: '',
    position: {
      x: 0,
      y: 0
    },
    temporary: false
  }
};

const Visualization = ({ isError, isLoading, steps, views }: IVisualization) => {
  const incrementAmt = 100;
  const stageRef = React.useRef<Konva.Stage>(null);
  const [tempSteps, setTempSteps] = React.useState<{model: IStepProps, viz: IVizStepProps}[]>([]);
  const [isPanelExpanded, setIsPanelExpanded] = React.useState(false);

  const [selectedStep, setSelectedStep] = React.useState<{viz: IVizStepProps, model: IStepProps}>(placeholderStep);

  const deleteStep = (e: any) => {
    const selectedStepVizId = selectedStep.viz.id;
    setIsPanelExpanded(false);
    setSelectedStep(placeholderStep);
    setTempSteps(tempSteps.filter((tempStep) => tempStep.viz.id !== selectedStepVizId));
  };

  const onDragEnd = e => {
  };

  const imageProps = {
    height: 40,
    width: 40
  };

  const handleClickStep = (e) => {
    if(!e.target.id()) {
      return;
    }

    // Only set state again if the ID is not the same
    if(selectedStep.model.id !== e.target.id()) {
      const combinedSteps = steps.concat(tempSteps);
      const findStep: {viz: IVizStepProps, model: IStepProps} = combinedSteps.find(step => step.viz.id === e.target.id()) ?? selectedStep;
      setSelectedStep(findStep);
    }

    setIsPanelExpanded(!isPanelExpanded);
  };

  const onExpandPanel = () => {
    //drawerRef.current && drawerRef.current.focus();
  };

  const onClosePanelClick = () => {
    setIsPanelExpanded(false);
  };

  // Stage is a div container
  // Layer is actual canvas element (so you may have several canvases in the stage)
  // And then we have canvas shapes inside the Layer
  return (
    <>
      <Drawer isExpanded={isPanelExpanded} onExpand={onExpandPanel}>
        <DrawerContent panelContent={<StepView step={selectedStep} isPanelExpanded={isPanelExpanded} deleteStep={deleteStep} onClosePanelClick={onClosePanelClick}/>}
                       className={'panelCustom'}>
          <DrawerContentBody>
            <div onDrop={(e: any) => {
              e.preventDefault();
              const dataJSON = e.dataTransfer.getData('text');
              // register event position
              stageRef.current?.setPointersPositions(e);
              //handleDrop(e);
              const parsed: IStepProps = JSON.parse(dataJSON);

              setTempSteps(tempSteps.concat({
                model: parsed,
                viz: {
                  data: { label: parsed.name },
                  id: uuidv4(),
                  position: {...stageRef.current?.getPointerPosition()},
                  temporary: true
                }
              }));
            }} onDragOver={(e) => e.preventDefault()}>
            <Stage width={window.innerWidth} height={window.innerHeight} ref={stageRef}>
              <Layer>
                {tempSteps.map((step, idx) => {
                  return (
                    <Group x={step.viz.position.x}
                           y={step.viz.position.y}
                           onClick={handleClickStep}
                           onDragEnd={onDragEnd}
                           id={step.viz.id}
                           onMouseEnter={(e: any) => {
                             // style stage container:
                             const container = e.target.getStage().container();
                             container.style.cursor = 'pointer';
                           }}
                           onMouseLeave={(e: any) => {
                             const container = e.target.getStage().container();
                             container.style.cursor = 'default';
                           }}
                           key={idx}
                           draggable>
                      <Circle
                        name={`${idx}`}
                        stroke={idx === 0 ? 'rgb(0, 136, 206)' : 'rgb(204, 204, 204)'}
                        fill={'white'}
                        strokeWidth={3}
                        width={CIRCLE_LENGTH}
                        height={CIRCLE_LENGTH}
                      />
                      <Image id={step.viz.id}
                             image={createImage(step.model.icon)}
                             offsetX={imageProps ? imageProps.width / 2 : 0}
                             offsetY={imageProps ? imageProps.height / 2 : 0}
                             height={imageProps.height}
                             width={imageProps.width}
                      />
                      <Text x={-(CIRCLE_LENGTH)}
                            y={(CIRCLE_LENGTH / 2) + 10}
                            align={'center'}
                            width={150}
                            fontSize={11}
                            text={truncateString(step.model.name, 14)}
                      />
                    </Group>
                  );
                })}
                <Group x={100} y={200} id={'Integration'} onDragEnd={onDragEnd} draggable>
                  <Line
                    points={[
                      100, 0,
                      steps.length * incrementAmt, 0
                    ]}
                    stroke={'black'}
                    strokeWidth={3}
                    lineCap={'round'}
                    lineJoin={'round'}
                  />
                  {steps.map((item, index) => {
                    const image = {
                      id: item.viz.id,
                      image: createImage(item.model.icon),
                      x: item.viz.position.x! - (imageProps.width / 2),
                      y: 0 - (imageProps.height / 2),
                      height: imageProps.height,
                      width: imageProps.width
                    };

                    return (
                      <Group key={index}
                             onClick={handleClickStep}
                             onMouseEnter={(e: any) => {
                               // style stage container:
                               const container = e.target.getStage().container();
                               container.style.cursor = 'pointer';
                             }}
                             onMouseLeave={(e: any) => {
                               const container = e.target.getStage().container();
                               container.style.cursor = 'default';
                             }}
                      >
                        <Circle
                          x={item.viz.position.x}
                          y={0}
                          name={`${index}`}
                          stroke={index === 0 ? 'rgb(0, 136, 206)' : 'rgb(204, 204, 204)'}
                          fill={'white'}
                          strokeWidth={3}
                          width={CIRCLE_LENGTH}
                          height={CIRCLE_LENGTH}
                        />
                        <Image {...image} />
                        <Text x={item.viz.position.x! - (CIRCLE_LENGTH)}
                              y={(CIRCLE_LENGTH / 2) + 10}
                              align={'center'}
                              width={150}
                              fontFamily={'Ubuntu'}
                              fontSize={11}
                              text={truncateString(item.model.name, 14)}
                        />
                      </Group>
                    )
                  })}
                </Group>
              </Layer>
            </Stage>
            </div>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export { Visualization };
