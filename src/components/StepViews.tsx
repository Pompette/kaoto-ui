import { IStepProps, IViewProps } from '../types';
import { usePrevious } from '../utils';
import { Extension } from './Extension';
import { JsonSchemaConfigurator } from './JsonSchemaConfigurator';
import { StepErrorBoundary } from './StepErrorBoundary';
import { dynamicImport } from './import';
import {
  Button,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Grid,
  GridItem,
  Tab,
  Tabs,
  TabTitleText,
} from '@patternfly/react-core';
import { lazy, useEffect, useRef, useState } from 'react';

export interface IStepViewsProps {
  deleteStep: (e: any) => void;
  isPanelExpanded: boolean;
  onClosePanelClick: (e: any) => void;
  saveConfig: (newValues: any) => void;
  step: IStepProps;
  views?: IViewProps[];
}

const StepViews = ({
  deleteStep,
  isPanelExpanded,
  onClosePanelClick,
  saveConfig,
  step,
  views,
}: IStepViewsProps) => {
  const hasDetailView = views?.some((v) => v.id === 'detail-step');
  const detailsTabIndex = views?.length! + 1; // provide an index that won't be used by custom views
  const configTabIndex = views?.length! + 2;
  const [activeTabKey, setActiveTabKey] = useState(detailsTabIndex);
  const stepPropertySchema = useRef<{ [label: string]: { type: string } }>({});
  const stepPropertyModel = useRef<{ [label: string]: any }>({});
  const previousTabIndex = usePrevious(detailsTabIndex);

  useEffect(() => {
    if (previousTabIndex === detailsTabIndex) {
      return;
    }

    setActiveTabKey(views?.some((v) => v.id === 'detail-step') ? 0 : detailsTabIndex);
  }, [detailsTabIndex, previousTabIndex, views]);

  useEffect(() => {
    let tempSchemaObject: { [label: string]: { type: string; value?: any } } = {};
    let tempModelObject: { [label: string]: any } = {};

    const schemaProps = (parameter: { [label: string]: any }) => {
      const propKey = parameter.title;
      const { type } = parameter;
      tempSchemaObject[propKey] = { type };
      tempModelObject[propKey] = parameter.value;
    };

    step.parameters?.map(schemaProps);

    stepPropertySchema.current = tempSchemaObject;
    stepPropertyModel.current = tempModelObject;
  }, [step.parameters]);

  const handleTabClick = (_event: any, tabIndex: any) => {
    setActiveTabKey(tabIndex);
  };

  return (
    <DrawerPanelContent
      isResizable
      id={'right-resize-panel'}
      defaultSize={'500px'}
      minSize={'150px'}
    >
      <DrawerHead>
        <h3 className={'pf-c-title pf-m-2xl'} tabIndex={isPanelExpanded ? 0 : -1}>
          Step Details
        </h3>
        <DrawerActions>
          <DrawerCloseButton onClick={onClosePanelClick} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
          {/** If the step does not have a default view, provide one */}
          {!hasDetailView && (
            <Tab
              eventKey={detailsTabIndex}
              title={<TabTitleText>Details</TabTitleText>}
              data-testid={'detailsTab'}
            >
              <StepErrorBoundary>
                <br />
                <Grid hasGutter>
                  <GridItem span={3}>
                    <b>Title</b>
                  </GridItem>
                  <GridItem span={6}>{step.title}</GridItem>
                  <GridItem span={3} rowSpan={2}>
                    <img src={step.icon} style={{ maxWidth: '50%' }} alt={'icon'} />
                  </GridItem>
                  <GridItem span={3}>
                    <b>Description</b>
                  </GridItem>
                  <GridItem span={6}>{step.description}</GridItem>
                  <GridItem span={3}>
                    <b>Type</b>
                  </GridItem>
                  <GridItem span={9}>
                    {step.type === 'START'
                      ? 'Source'
                      : step.type === 'MIDDLE'
                      ? 'Action'
                      : step.type === 'END'
                      ? 'Sink'
                      : ''}
                  </GridItem>
                </Grid>
                <br />
                <Button variant={'danger'} key={step.UUID} onClick={deleteStep}>
                  Delete
                </Button>
              </StepErrorBoundary>
            </Tab>
          )}

          {/** Show rest of views provided **/}
          {views?.length! > 0 &&
            views?.map((view, index) => {
              const StepExtension = lazy(() => dynamicImport(view.scope, view.module, view.url));

              // Example demonstrating interactivity with step extension
              const onButtonClicked = () => {
                console.log(
                  'Button clicked! Viewing ' + view.id + ' for the following step: ' + view.step
                );
              };

              return (
                <Tab
                  eventKey={index}
                  key={index}
                  title={<TabTitleText>{view.name}</TabTitleText>}
                  data-testid={'stepExtensionTab'}
                >
                  <StepErrorBoundary>
                    <Extension
                      name="extension"
                      loading="Loading extension..."
                      failure="Could not load extension. Is it running?"
                    >
                      <StepExtension
                        text="Passed from Kaoto!"
                        onButtonClicked={onButtonClicked}
                        path="/"
                      />
                    </Extension>
                  </StepErrorBoundary>
                </Tab>
              );
            })}

          <Tab
            eventKey={configTabIndex}
            title={<TabTitleText>Config</TabTitleText>}
            data-testid={'configurationTab'}
          >
            <br />
            <StepErrorBoundary>
              <Grid hasGutter>
                {step.parameters && (
                  <JsonSchemaConfigurator
                    schema={{ type: 'object', properties: stepPropertySchema.current }}
                    configuration={stepPropertyModel.current}
                    onSubmit={(configuration, isValid) => {
                      if (isValid) {
                        saveConfig(configuration);
                      }
                    }}
                  />
                )}
              </Grid>
              <br />
              <Button variant={'danger'} key={step.UUID} onClick={deleteStep}>
                Delete
              </Button>
            </StepErrorBoundary>
          </Tab>
        </Tabs>
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export { StepViews };
