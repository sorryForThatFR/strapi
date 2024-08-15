import axios from 'axios';
import { useEffect, useState } from 'react';

import styles from './FromBrandfolder.module.css';
import { Checkbox } from '@strapi/design-system';

const brandFolderApi = axios.create({
  baseURL: 'https://brandfolder.com/api/v4',
  headers: {
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJvcmdhbml6YXRpb25fa2V5IjoicW5zNThqcHE3OWo5M3drYm5oeGdxOSIsImlhdCI6MTcyMzY2OTgzNiwidXNlcl9rZXkiOiJtbjhmNDdmamM1NW5wbWI1cDlrdDI3Iiwic3VwZXJ1c2VyIjpmYWxzZX0.EfuqbZXvVOGfdsD5PGsLzlzTbx8pDYjlFsoliAjSaMc'
  }
});

const STEPS = {
  SELECT_BRANDFOLDER: 'select_brandfolder',
  SELECT_ASSETS: 'select_assets',
};

export const FromBrandfolder = ({ onClose, onAddAsset, trackedLocation }) => {
  const [brandfolders, setBrandfolders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedBrandfolder, setSelectedBrandfolder] = useState();
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [step, setStep] = useState(STEPS.SELECT_BRANDFOLDER);
  
  useEffect(() => {
    (async () => {
      const brandfoldersResp = await brandFolderApi.get('/brandfolders');
      const brandfolders = brandfoldersResp.data?.data;

      if (Array.isArray(brandfolders)) {
        setBrandfolders(brandfolders);
      }
    })();
  }, []);
  
  useEffect(() => {
    (async () => {
      if (selectedBrandfolder) {
        const assetsResp = await brandFolderApi.get(`/brandfolders/${selectedBrandfolder.id}/assets`);
        const { data: assetsRespData } = assetsResp;
        const { data: assets } = assetsRespData ?? {};

        if (Array.isArray(assets)) {
          setAssets(assets);
        }
      }
    })();
  }, [selectedBrandfolder]);

  const onBrandfolderClick = (brandfolder) => {
    setSelectedBrandfolder(brandfolder);
    setStep(STEPS.SELECT_ASSETS);
  };

  const onAssetClick = (asset) => {
    setSelectedAssets((prevAssets) => {
      const isSelected = Boolean(prevAssets.find(({ id }) => id === asset.id));
      
      if (isSelected) {
        return prevAssets.filter(({ id }) => id !== asset.id);
      }

      return [...prevAssets, asset];
    });
  };

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <span
          style={{
            fontSize: 24,
            color: 'white',
          }}
        >Select assets</span>
      </div>

      <div className={styles.section}>
        <div className={styles.stepHeader}>
          <span
            className={styles.stepTitle}
          >{selectedBrandfolder ? `Brandfolder: ${selectedBrandfolder.attributes.name}` : 'Select brandfolder'}</span>
        </div>
        {step === STEPS.SELECT_BRANDFOLDER && (
            <div>
              {brandfolders.map((brandfolder) => {
                const { attributes } = brandfolder;
                const { name } = attributes;

                return (
                  <div
                    className={styles.brandfolderItem}
                    onClick={() => onBrandfolderClick(brandfolder)}
                  >{name}</div>
                );
              })}
            </div>
        )}
      </div>

      {step === STEPS.SELECT_ASSETS && (
        <div className={styles.section}>
          <div>
              {assets.map((asset) => {
                const { attributes } = asset;
                const { name } = attributes;
                const isSelected = Boolean(selectedAssets.find(({ id }) => id === asset.id));

                return (
                  <div
                    className={styles.brandfolderItem}
                    onClick={() => onAssetClick(asset)}
                  >
                    <Checkbox
                      style={{ width: 16 }}
                      width={16}
                      value={isSelected}
                    />
                    {name}
                  </div>
                );
              })}
            </div>
        </div>
      )}
      
      
    </div>
    
  );
};