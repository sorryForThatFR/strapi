import React, { useMemo } from 'react';

import { BaseCheckbox, Box, Flex, Typography } from '@strapi/design-system';
import { CarretDown } from '@strapi/icons';
import get from 'lodash/get';
import { useIntl } from 'react-intl';
import styled, { DefaultTheme, css } from 'styled-components';
import { useRouteMatch } from 'react-router-dom';

import { Action, SubjectProperty } from '../../../../../../../shared/contracts/permissions';
import { useAdminRolePermissions } from '../../../../../hooks/useAdminRolePermissions';
import { capitalise } from '../../../../../utils/strings';
import {
  PermissionsDataManagerContextValue,
  usePermissionsDataManager,
} from '../hooks/usePermissionsDataManager';
import { cellWidth, firstRowWidth, rowHeight } from '../utils/constants';
import { getCheckboxState } from '../utils/getCheckboxState';

import { CollapseLabel } from './CollapseLabel';
import { HiddenAction } from './HiddenAction';
import { RequiredSign } from './RequiredSign';
import { RowLabelWithCheckbox, RowLabelWithCheckboxProps } from './RowLabelWithCheckbox';

/* -------------------------------------------------------------------------------------------------
 * CollapsePropertyMatrix
 * -----------------------------------------------------------------------------------------------*/

interface CollapsePropertyMatrixProps
  extends Pick<
    ActionRowProps,
    'childrenForm' | 'isFormDisabled' | 'label' | 'pathToData' | 'propertyName'
  > {
  availableActions?: Array<Action & { isDisplayed: boolean }>;
}

interface PropertyAction {
  label: string;
  actionId: string;
  isActionRelatedToCurrentProperty: boolean;
}

const CollapsePropertyMatrix = ({
  availableActions = [],
  childrenForm = [],
  isFormDisabled,
  label,
  pathToData,
  propertyName,
}: CollapsePropertyMatrixProps) => {
  const recursiveChildren = useMemo(() => {
    if (!Array.isArray(childrenForm)) {
      return [];
    }

    return childrenForm;
  }, [childrenForm]);

  const isCollapsable = recursiveChildren.length > 0;
  const propertyActions = useMemo(
    () =>
      availableActions.map((action) => {
        const isActionRelatedToCurrentProperty =
          Array.isArray(action.applyToProperties) &&
          action.applyToProperties.indexOf(propertyName) !== -1 &&
          action.isDisplayed;

        return { label: action.label, actionId: action.actionId, isActionRelatedToCurrentProperty };
      }) satisfies PropertyAction[],
    [availableActions, propertyName]
  );

  const propertyActionsForHeaders = [...propertyActions];

  if (isCollapsable) {
    if (
      !propertyActionsForHeaders.find(
        ({ actionId }) => actionId === 'plugin::content-manager.explorer.extra'
      )
    ) {
      propertyActionsForHeaders.push({
        actionId: 'plugin::content-manager.explorer.extra',
        isActionRelatedToCurrentProperty: true,
        label: 'Drag',
      });
    }
  }

  return (
    <Flex display="inline-flex" direction="column" minWidth={0}>
      <Header label={label} headers={propertyActionsForHeaders} />
      <Box>
        {childrenForm.map(({ children: childrenForm, label, value, required }, i) => (
          <ActionRow
            childrenForm={childrenForm}
            key={value}
            label={label}
            isFormDisabled={isFormDisabled}
            name={value}
            required={required}
            propertyActions={propertyActions}
            pathToData={pathToData}
            propertyName={propertyName}
            isOdd={i % 2 === 0}
          />
        ))}
      </Box>
    </Flex>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ActionRow
 * -----------------------------------------------------------------------------------------------*/

interface ActionRowProps
  extends Pick<
    SubActionRowProps,
    'childrenForm' | 'isFormDisabled' | 'propertyActions' | 'propertyName'
  > {
  label: string;
  name: string;
  required?: boolean;
  pathToData: string;
  isOdd?: boolean;
}

const ActionRow = ({
  childrenForm = [],
  label,
  isFormDisabled = false,
  name,
  required = false,
  pathToData,
  propertyActions: propsPropertyActions,
  propertyName,
  isOdd = false,
}: ActionRowProps) => {
  const { formatMessage } = useIntl();
  const [rowToOpen, setRowToOpen] = React.useState<string | null>(null);
  const {
    modifiedData,
    onChangeCollectionTypeLeftActionRowCheckbox,
    onChangeParentCheckbox,
    onChangeSimpleCheckbox,
  } = usePermissionsDataManager();

  const propertyActions = [...propsPropertyActions];
  const {
    params: { id },
  } = useRouteMatch('/settings/roles/:id') as any;
  const { permissions, isLoading: isLoadingPermissions } = useAdminRolePermissions(
    { id },
    {
      cacheTime: 0,
    }
  );

  const isActive = rowToOpen === name;

  const recursiveChildren = useMemo(() => {
    if (!Array.isArray(childrenForm)) {
      return [];
    }

    return childrenForm;
  }, [childrenForm]);

  const isCollapsable = recursiveChildren.length > 0;

  const handleClick = React.useCallback(() => {
    if (isCollapsable) {
      setRowToOpen((prev) => {
        if (prev === name) {
          return null;
        }

        return name;
      });
    }
  }, [isCollapsable, name]);

  const handleChangeLeftRowCheckbox: RowLabelWithCheckboxProps['onChange'] = ({
    target: { value },
  }) => {
    onChangeCollectionTypeLeftActionRowCheckbox(pathToData, propertyName, name, value);
  };

  const { hasAllActionsSelected, hasSomeActionsSelected } = useMemo(() => {
    return getRowLabelCheckboxState(propertyActions, modifiedData, pathToData, propertyName, name);
  }, [propertyActions, modifiedData, pathToData, propertyName, name]);

  if (isCollapsable) {
    if (
      !propertyActions.find(({ actionId }) => actionId === 'plugin::content-manager.explorer.extra')
    ) {
      propertyActions.push({
        actionId: 'plugin::content-manager.explorer.extra',
        isActionRelatedToCurrentProperty: true,
        label: 'Drag',
      });
    }
  }

  return (
    <>
      <Wrapper
        alignItems="center"
        isCollapsable={isCollapsable}
        isActive={isActive}
        background={isOdd ? 'neutral100' : 'neutral0'}
      >
        <Flex>
          <RowLabelWithCheckbox
            onChange={handleChangeLeftRowCheckbox}
            onClick={handleClick}
            isCollapsable={isCollapsable}
            isFormDisabled={isFormDisabled}
            label={label}
            someChecked={hasSomeActionsSelected}
            value={hasAllActionsSelected}
            isActive={isActive}
          >
            {required && <RequiredSign />}
            <CarretIcon $isActive={isActive} />
          </RowLabelWithCheckbox>
          <Flex>
            {propertyActions.map(({ label, isActionRelatedToCurrentProperty, actionId }) => {
              if (!isActionRelatedToCurrentProperty) {
                return <HiddenAction key={label} />;
              }

              let checkboxName = [
                ...pathToData.split('..'),
                actionId,
                'properties',
                propertyName,
                name,
              ];

              if (actionId === 'plugin::content-manager.explorer.extra') {
                if (label === 'Drag') {
                  checkboxName = [...pathToData.split('..'), actionId, 'properties', 'drag', name];
                }
              }

              if (!isCollapsable) {
                const checkboxValue = get(modifiedData, checkboxName, false);

                return (
                  <Flex
                    key={actionId}
                    width={cellWidth}
                    position="relative"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <BaseCheckbox
                      disabled={isFormDisabled}
                      name={checkboxName.join('..')}
                      aria-label={formatMessage(
                        {
                          id: `Settings.permissions.select-by-permission`,
                          defaultMessage: 'Select {label} permission',
                        },
                        { label: `${name} ${label}` }
                      )}
                      // Keep same signature as packages/core/admin/admin/src/components/Roles/Permissions/index.js l.91
                      onValueChange={(value) => {
                        onChangeSimpleCheckbox({
                          target: {
                            name: checkboxName.join('..'),
                            value,
                          },
                        });
                      }}
                      value={checkboxValue}
                    />
                  </Flex>
                );
              }

              const data = get(modifiedData, checkboxName, {});

              const checkboxState = getCheckboxState(data);
              let { hasAllActionsSelected } = checkboxState;
              const { hasSomeActionsSelected } = checkboxState;
              const isExtraAction = actionId === 'plugin::content-manager.explorer.extra';

              if (isExtraAction) {
                const neededSubject = pathToData.split('..')[1];

                let defaultValue = false;

                try {
                  if (neededSubject) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
                    const neededPermission = permissions?.find(({ action, subject }) => {
                      return action === actionId && subject === neededSubject;
                    });

                    if (neededPermission) {
                      defaultValue = neededPermission.properties[
                        checkboxName[checkboxName.length - 2]
                      ].includes(checkboxName[checkboxName.length - 1]);
                    }
                  }
                } catch (err) {
                  console.error(err);
                }

                hasAllActionsSelected = !get(modifiedData, checkboxName, defaultValue);
              }

              return (
                <Flex
                  key={label}
                  width={cellWidth}
                  position="relative"
                  justifyContent="center"
                  alignItems="center"
                >
                  <BaseCheckbox
                    disabled={isFormDisabled}
                    name={checkboxName.join('..')}
                    // Keep same signature as packages/core/admin/admin/src/components/Roles/Permissions/index.js l.91
                    onValueChange={(value) => {
                      onChangeParentCheckbox({
                        target: {
                          name: checkboxName.join('..'),
                          value: isExtraAction ? !value : value,
                        },
                      });
                    }}
                    aria-label={formatMessage(
                      {
                        id: `Settings.permissions.select-by-permission`,
                        defaultMessage: 'Select {label} permission',
                      },
                      { label: `${name} ${label}` }
                    )}
                    value={hasAllActionsSelected}
                    indeterminate={hasSomeActionsSelected}
                  />
                </Flex>
              );
            })}
          </Flex>
        </Flex>
      </Wrapper>
      {isActive && (
        <SubActionRow
          childrenForm={recursiveChildren}
          isFormDisabled={isFormDisabled}
          parentName={name}
          pathToDataFromActionRow={pathToData}
          propertyName={propertyName}
          propertyActions={propsPropertyActions}
          recursiveLevel={0}
        />
      )}
    </>
  );
};

/**
 *
 * Returns the state of the left checkbox of a ActionRow main checkbox
 */
const getRowLabelCheckboxState = (
  propertyActions: PropertyAction[],
  modifiedData: PermissionsDataManagerContextValue['modifiedData'],
  pathToContentType: string,
  propertyToCheck: string,
  targetKey: string
) => {
  const actionIds = propertyActions.reduce<string[]>((acc, current) => {
    if (current.isActionRelatedToCurrentProperty) {
      acc.push(current.actionId);
    }

    return acc;
  }, []);

  const data = actionIds.reduce<Record<string, boolean>>((acc, current) => {
    const mainData = get(
      modifiedData,
      [...pathToContentType.split('..'), current, 'properties', propertyToCheck, targetKey],
      false
    );

    acc[current] = mainData;

    return acc;
  }, {});

  return getCheckboxState(data);
};

const Wrapper = styled(Flex)<{ isCollapsable?: boolean; isActive?: boolean }>`
  height: ${rowHeight};
  flex: 1;

  ${({ isCollapsable, theme }) =>
    isCollapsable &&
    `
      ${CarretIcon} {
        display: block;
        color: ${theme.colors.neutral100};
      }
      &:hover {
        ${activeStyle(theme)}
      }
  `}
  ${({ isActive, theme }) => isActive && activeStyle(theme)};
`;

const CarretIcon = styled(CarretDown)<{ $isActive: boolean }>`
  display: none;
  width: ${10 / 16}rem;
  transform: rotate(${({ $isActive }) => ($isActive ? '180' : '0')}deg);
  margin-left: ${({ theme }) => theme.spaces[2]};
`;

/* -------------------------------------------------------------------------------------------------
 * SubActionRow
 * -----------------------------------------------------------------------------------------------*/

interface SubActionRowProps {
  childrenForm: SubjectProperty['children'];
  isFormDisabled?: boolean;
  parentName: string;
  pathToDataFromActionRow: string;
  propertyActions: PropertyAction[];
  propertyName: string;
  recursiveLevel: number;
}

const SubActionRow = ({
  childrenForm = [],
  isFormDisabled,
  recursiveLevel,
  pathToDataFromActionRow,
  propertyActions,
  parentName,
  propertyName,
}: SubActionRowProps) => {
  const { formatMessage } = useIntl();
  const { modifiedData, onChangeParentCheckbox, onChangeSimpleCheckbox } =
    usePermissionsDataManager();
  const [rowToOpen, setRowToOpen] = React.useState<string | null>(null);

  const handleClickToggleSubLevel = (name: string) => {
    setRowToOpen((prev) => {
      if (prev === name) {
        return null;
      }

      return name;
    });
  };

  const displayedRecursiveChildren = useMemo(() => {
    if (!rowToOpen) {
      return null;
    }

    return childrenForm.find(({ value }) => value === rowToOpen);
  }, [rowToOpen, childrenForm]);

  return (
    <Box paddingLeft={`2rem`}>
      <TopTimeline />
      {childrenForm.map(({ label, value, required, children: subChildrenForm }, index) => {
        const isVisible = index + 1 < childrenForm.length;
        const isArrayType = Array.isArray(subChildrenForm);
        const isActive = rowToOpen === value;

        return (
          <LeftBorderTimeline key={value} isVisible={isVisible}>
            <Flex height={rowHeight}>
              <StyledBox>
                <Svg
                  width="20"
                  height="23"
                  viewBox="0 0 20 23"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  color="primary200"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7.02477 14.7513C8.65865 17.0594 11.6046 18.6059 17.5596 18.8856C18.6836 18.9384 19.5976 19.8435 19.5976 20.9688V20.9688C19.5976 22.0941 18.6841 23.0125 17.5599 22.9643C10.9409 22.6805 6.454 20.9387 3.75496 17.1258C0.937988 13.1464 0.486328 7.39309 0.486328 0.593262H4.50974C4.50974 7.54693 5.06394 11.9813 7.02477 14.7513Z"
                    fill="#D9D8FF"
                  />
                </Svg>
              </StyledBox>
              <Flex style={{ flex: 1 }}>
                <RowStyle level={recursiveLevel} isActive={isActive} isCollapsable={isArrayType}>
                  <CollapseLabel
                    alignItems="center"
                    isCollapsable={isArrayType}
                    {...(isArrayType && {
                      onClick: () => handleClickToggleSubLevel(value),
                      'aria-expanded': isActive,
                      onKeyDown: ({ key }) =>
                        (key === 'Enter' || key === ' ') && handleClickToggleSubLevel(value),
                      tabIndex: 0,
                      role: 'button',
                    })}
                    title={label.split('.').join(' ')}
                  >
                    <Typography ellipsis>{capitalise(label.split('.').join(' '))}</Typography>
                    {required && <RequiredSign />}
                    <CarretIcon $isActive={isActive} />
                  </CollapseLabel>
                </RowStyle>
                <Flex style={{ flex: 1 }}>
                  {propertyActions.map(
                    ({ actionId, label: propertyLabel, isActionRelatedToCurrentProperty }) => {
                      if (!isActionRelatedToCurrentProperty) {
                        return <HiddenAction key={actionId} />;
                      }
                      /*
                       * Usually we use a 'dot' in order to know the key path of an object for which we want to change the value.
                       * Since an action and a subject are both separated by '.' or '::' we chose to use the '..' separators
                       */
                      const checkboxName = [
                        ...pathToDataFromActionRow.split('..'),
                        actionId,
                        'properties',
                        propertyName,
                        ...parentName.split('..'),
                        value,
                      ];

                      const checkboxValue = get(modifiedData, checkboxName, false);

                      if (!subChildrenForm) {
                        return (
                          <Flex
                            key={propertyLabel}
                            position="relative"
                            width={cellWidth}
                            justifyContent="center"
                            alignItems="center"
                          >
                            <BaseCheckbox
                              disabled={isFormDisabled}
                              name={checkboxName.join('..')}
                              aria-label={formatMessage(
                                {
                                  id: `Settings.permissions.select-by-permission`,
                                  defaultMessage: 'Select {label} permission',
                                },
                                { label: `${parentName} ${label} ${propertyLabel}` }
                              )}
                              // Keep same signature as packages/core/admin/admin/src/components/Roles/Permissions/index.js l.91
                              onValueChange={(value) => {
                                onChangeSimpleCheckbox({
                                  target: {
                                    name: checkboxName.join('..'),
                                    value,
                                  },
                                });
                              }}
                              value={checkboxValue}
                            />
                          </Flex>
                        );
                      }

                      const { hasAllActionsSelected, hasSomeActionsSelected } =
                        getCheckboxState(checkboxValue);

                      return (
                        <Flex
                          key={propertyLabel}
                          position="relative"
                          width={cellWidth}
                          justifyContent="center"
                          alignItems="center"
                        >
                          <BaseCheckbox
                            key={propertyLabel}
                            disabled={isFormDisabled}
                            name={checkboxName.join('..')}
                            aria-label={formatMessage(
                              {
                                id: `Settings.permissions.select-by-permission`,
                                defaultMessage: 'Select {label} permission',
                              },
                              { label: `${parentName} ${label} ${propertyLabel}` }
                            )}
                            // Keep same signature as packages/core/admin/admin/src/components/Roles/Permissions/index.js l.91
                            onValueChange={(value) => {
                              onChangeParentCheckbox({
                                target: {
                                  name: checkboxName.join('..'),
                                  value,
                                },
                              });
                            }}
                            value={hasAllActionsSelected}
                            indeterminate={hasSomeActionsSelected}
                          />
                        </Flex>
                      );
                    }
                  )}
                </Flex>
              </Flex>
            </Flex>
            {displayedRecursiveChildren && isActive && (
              <Box paddingBottom={2}>
                <SubActionRow
                  isFormDisabled={isFormDisabled}
                  parentName={`${parentName}..${value}`}
                  pathToDataFromActionRow={pathToDataFromActionRow}
                  propertyActions={propertyActions}
                  propertyName={propertyName}
                  recursiveLevel={recursiveLevel + 1}
                  childrenForm={displayedRecursiveChildren.children}
                />
              </Box>
            )}
          </LeftBorderTimeline>
        );
      })}
    </Box>
  );
};

const LeftBorderTimeline = styled(Box)<{ isVisible?: boolean }>`
  border-left: ${({ isVisible, theme }) =>
    isVisible ? `4px solid ${theme.colors.primary200}` : '4px solid transparent'};
`;

const RowStyle = styled(Flex)<{ level: number; isCollapsable?: boolean; isActive?: boolean }>`
  padding-left: ${({ theme }) => theme.spaces[4]};
  width: ${({ level }) => 145 - level * 36}px;

  ${({ isCollapsable, theme }) =>
    isCollapsable &&
    `
      ${CarretIcon} {
        display: block;
        color: ${theme.colors.neutral100};
      }
      &:hover {
        ${activeStyle(theme)}
      }
  `}
  ${({ isActive, theme }) => isActive && activeStyle(theme)};
`;

const TopTimeline = styled.div`
  padding-top: ${({ theme }) => theme.spaces[2]};
  margin-top: ${({ theme }) => theme.spaces[2]};
  width: ${4 / 16}rem;
  background-color: ${({ theme }) => theme.colors.primary200};
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
`;

const StyledBox = styled(Box)`
  transform: translate(-4px, -12px);

  &:before {
    content: '';
    width: ${4 / 16}rem;
    height: ${12 / 16}rem;
    background: ${({ theme }) => theme.colors.primary200};
    display: block;
  }
`;

const Svg = styled.svg<{ color: keyof DefaultTheme['colors'] }>`
  position: relative;
  flex-shrink: 0;
  transform: translate(-0.5px, -1px);

  * {
    fill: ${({ theme, color }) => theme.colors[color]};
  }
`;

/* -------------------------------------------------------------------------------------------------
 * Header
 * -----------------------------------------------------------------------------------------------*/

interface HeaderProps {
  headers?: PropertyAction[];
  label: string;
}

const Header = ({ headers = [], label }: HeaderProps) => {
  const { formatMessage } = useIntl();

  return (
    <Flex>
      <Flex width={firstRowWidth} height={rowHeight} shrink={0} alignItems="center" paddingLeft={6}>
        <Typography variant="sigma" textColor="neutral500">
          {formatMessage(
            {
              id: 'Settings.roles.form.permission.property-label',
              defaultMessage: '{label} permissions',
            },
            { label }
          )}
        </Typography>
      </Flex>
      {headers.map((header) => {
        if (!header.isActionRelatedToCurrentProperty) {
          return <Flex width={cellWidth} shrink={0} key={header.label} />;
        }

        return (
          <Flex width={cellWidth} shrink={0} justifyContent="center" key={header.label}>
            <Typography variant="sigma" textColor="neutral500">
              {formatMessage({
                id: `Settings.roles.form.permissions.${header.label.toLowerCase()}`,
                defaultMessage: header.label,
              })}
            </Typography>
          </Flex>
        );
      })}
    </Flex>
  );
};

/* -------------------------------------------------------------------------------------------------
 * activeStyle (util)
 * -----------------------------------------------------------------------------------------------*/

/**
 * @internal
 */
const activeStyle = (theme: DefaultTheme) => css`
  ${Typography} {
    color: ${theme.colors.primary600};
    font-weight: ${theme.fontWeights.bold};
  }
  ${CarretIcon} {
    display: block;

    path {
      fill: ${theme.colors.primary600};
    }
  }
`;

export { activeStyle as _internalActiveStyle };
export { CollapsePropertyMatrix };
