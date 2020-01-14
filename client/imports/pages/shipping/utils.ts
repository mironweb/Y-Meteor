import { MeteorObservable } from 'meteor-rxjs';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import { of } from 'rxjs/observable/of';
import { switchMap } from 'rxjs/operators';

import {
  CustomerShipment,
  CustomerShipmentPallet,
  CustomerShipmentBox,
  CustomerShipmentProduct,
} from '../../../../both/models/customerShipment.model';

const SHIPMENTS_COLLECTION = 'customerShipments';
const SHIPMENT_STATUS = {
  OPEN: 'Open',
  COMPLETE: 'Complete',
};

function formDataToProduct(details) {
  const product: CustomerShipmentProduct = {
    _id: Random.id(),
    productId: details.productId,
    createdUserId: Meteor.userId(),
    createdAt: new Date(),
    customerOrderId: details.customerOrderId,
    warehouseBinId: details.binNumber || '',
    qtyShipped: Number(details.qtyToShip),
    weight: 0,
  };
  return product;
};

function formDataToBox(details) {
  const product = formDataToProduct(details);
  const box: CustomerShipmentBox = {
    _id: Random.id(),
    createdUserId: Meteor.userId(),
    createdAt: new Date(),
    sequence: details.boxNumber,
    products: [product],
  };
  return box;
};

function formDataToPallet(details) {
  const box = formDataToBox(details);
  const pallet: CustomerShipmentPallet = {
    _id: Random.id(),
    createdUserId: Meteor.userId(),
    createdAt: new Date(),
    sequence: details.palletNumber,
    weight: 0,
    boxes: [box],
  };
  return pallet;
};

export function getPalletBoxProduct(
  shipment,
  productField = '_id',
  fieldValue
) {
  let found = false;
  let pallet = null;
  let box = null;
  let product = null;

  shipment.pallets.forEach((_pallet, i) => {
    if (found) return;
    _pallet.boxes.forEach((_box, j) => {
      if (found) return;
      _box.products.forEach((_product, k) => {
        if (found) return;
        if (_product[productField] === fieldValue) {
          found = true;
          pallet = _pallet;
          pallet.index = i;
          box = _box;
          box.index = j;
          product = _product;
          product.index = k;
        }
      });
    });
  });

  return {
    found,
    pallet,
    box,
    product,
  };
};

export function getProductBinName(product) {
  const filter = (p) => p._id === 'TXdApe769yDuskww8';
  const warehouse = (product.warehouses || []).find(filter);
  const primaryBinId = warehouse? warehouse.primaryBinId: '';

  if (!primaryBinId) {
    return of('');
  }

  return of('getProductBinName').pipe(
    switchMap(() => {
      const query = { _id: primaryBinId };
      return MeteorObservable.call('findOne', 'warehouseBins', query);
    }),
    switchMap((warehouseBin: any) => {
      const binName = (warehouseBin || {}).name;
      return of(binName);
    })
  );
}

export function hasOpenShipment(customerOrderId) {
  const query = {
    status: SHIPMENT_STATUS.OPEN,
    'pallets.boxes.products.customerOrderId': customerOrderId,
  };
  return MeteorObservable.call('findOne', SHIPMENTS_COLLECTION, query);
};

export function createShipment(customerOrderId, details) {
  return of('createShipment').pipe(
    switchMap(() => {
      const query = { name: 'customerShipmentsNextNumber' };
      return MeteorObservable.call('findOne', 'systemOptions', query);
    }),
    switchMap((systemOption: any) => {
      details.nextNumber = systemOption.value + '';
      return of(systemOption);
    }),
    switchMap(() => {
      const query = { name: 'customerShipmentsNextNumber' };
      const update = { $inc: { value: 1 } }; // increment the nextNumber option
      return MeteorObservable.call('update', 'systemOptions', query, update);
    }),
    switchMap(() => {
      const query = { _id: customerOrderId };
      return MeteorObservable.call('findOne', 'customerOrders', query);
    }),
    switchMap((customerOrder: any) => {
      const shipment: CustomerShipment = {
        _id: Random.id(),
        tenantId: Session.get('tenantId'),
        createdUserId: Meteor.userId(),
        createdAt: new Date(),
        number: details.nextNumber || '',
        status: SHIPMENT_STATUS.OPEN,
        customerId: customerOrder.customerId,
        shipToName: customerOrder.shipToName,
        shipToAddress1: customerOrder.shipToAddress1,
        shipToAddress2: customerOrder.shipToAddress2,
        shipToAddress3: customerOrder.shipToAddress3,
        shipToCity: customerOrder.shipToCity,
        shipToState: customerOrder.shipToState,
        shipToZipCode: customerOrder.shipToZipCode,
        shipMethod: customerOrder.shipMethod,
        notes: customerOrder.notes,
        trackingNumber: '',
        pallets: [],
      };
      if (details) {
        shipment.pallets.push(formDataToPallet(details));
      }
      return MeteorObservable.call('insert', SHIPMENTS_COLLECTION, shipment);
    })
  );
};

export function addProductToShipment(customerShipmentId, details) {
  return of('addProductToShipment').pipe(
    switchMap(() => {
      const query = {
        _id: customerShipmentId,
        status: SHIPMENT_STATUS.OPEN,
      };
      return MeteorObservable.call('findOne', SHIPMENTS_COLLECTION, query);
    }),
    switchMap((shipmentResult: any) => {
      const query = {
        _id: customerShipmentId,
        status: SHIPMENT_STATUS.OPEN,
      };

      let palletIndex = null;
      shipmentResult.pallets.forEach((pallet, i) => {
        if (palletIndex !== null) return;
        if (pallet.sequence !== details.palletNumber) return;
        palletIndex = i;
      });

      // if pallet does not exists then add a new pallet
      if (palletIndex === null) {
        return MeteorObservable.call('update', SHIPMENTS_COLLECTION, query, {
          $push: {
            pallets: formDataToPallet(details),
          },
        });
      }

      let boxIndex = null;
      shipmentResult.pallets[palletIndex].boxes.forEach((box, i) => {
        if (boxIndex !== null) return;
        if (box.sequence !== details.boxNumber) return;
        boxIndex = i;
      });

      // if box does not exists then add a new box
      if (boxIndex === null) {
        return MeteorObservable.call('update', SHIPMENTS_COLLECTION, query, {
          $push: {
            [`pallets.${palletIndex}.boxes`]: formDataToBox(details),
          },
        });
      }

      return MeteorObservable.call('update', SHIPMENTS_COLLECTION, query, {
        $push: {
          [`pallets.${palletIndex}.boxes.${boxIndex}.products`]:
            formDataToProduct(details),
        },
      });
    })
  );
};

export function removeProductFromShipment(
  customerShipmentId,
  shipmentProductId,
  deleteShipmentIfEmpty = false,
) {
  const query = {
    _id: customerShipmentId,
    'pallets.boxes.products._id': shipmentProductId,
    status: SHIPMENT_STATUS.OPEN,
  };

  return MeteorObservable.call('findOne', SHIPMENTS_COLLECTION, query)
    .pipe(switchMap((shipmentResult: any) => {
      // console.log('removing item', shipmentResult);
      const data = getPalletBoxProduct(shipmentResult, '_id', shipmentProductId);
      // console.log(data);

      // if deleteShipmentIfEmpty is true
      // and if shipment contains 1 pallet, 1 box, and 1 product
      // then delete the shipment (to avoid empty shipment)
      if (deleteShipmentIfEmpty &&
          shipmentResult.pallets.length <=1 &&
          data.pallet.boxes.length <= 1 &&
          data.box.products.length <= 1
        ) {
        // console.log('deleting shipment')
        return MeteorObservable.call('remove', SHIPMENTS_COLLECTION, {
          _id: customerShipmentId,
        });
      }

      // if pallet contains 1 box and 1 product then delete the pallet
      if (data.pallet.boxes.length <= 1 && data.box.products.length <= 1) {
        // console.log('deleting pallet')
        return MeteorObservable.call('update', SHIPMENTS_COLLECTION, query, {
          $pull: {
            [`pallets`]: { _id: data.pallet._id },
          },
        });
      }

      // if pallet box contains 1 product then delete the box
      if (data.box.products.length <= 1) {
        // console.log('deleting box')
        return MeteorObservable.call('update', SHIPMENTS_COLLECTION, query, {
          $pull: {
            [`pallets.${data.pallet.index}.boxes`]: { _id: data.box._id },
          },
        });
      }

      // else just delete the product
      // console.log('deleting product')
      return MeteorObservable.call('update', SHIPMENTS_COLLECTION, query, {
        $pull: {
          [`pallets.${data.pallet.index}.boxes.${data.box.index}.products`]:
            { _id: shipmentProductId },
        },
      });
    }));
};
