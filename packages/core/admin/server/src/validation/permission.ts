import { yup, validateYupSchema } from '@strapi/utils';
import { getService } from '../utils';
import validators from './common-validators';

const checkPermissionsSchema = yup.object().shape({
  permissions: yup.array().of(
    yup
      .object()
      .shape({
        action: yup.string().required(),
        subject: yup.string().nullable(),
        field: yup.string(),
      })
      .noUnknown()
  ),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const checkPermissionsExist = function (permissions: any) {
  return true;
};

const actionsExistSchema = yup
  .array()
  .of(
    yup.object().shape({
      conditions: yup.array().of(yup.string()),
    })
  )
  .test('actions-exist', '', checkPermissionsExist);

export const validatePermissionsExist = validateYupSchema(actionsExistSchema);
export const validateCheckPermissionsInput = validateYupSchema(checkPermissionsSchema);
export const validatedUpdatePermissionsInput = validateYupSchema(validators.updatePermissions);

export default {
  validatedUpdatePermissionsInput,
  validatePermissionsExist,
  validateCheckPermissionsInput,
};
