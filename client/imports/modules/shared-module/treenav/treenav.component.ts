import {NestedTreeControl} from '@angular/cdk/tree';
import {Component, EventEmitter, Output} from '@angular/core';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {MeteorObservable} from 'meteor-rxjs';

interface TreeNode {
  _id: string;
  name: string;
  children: TreeNode[];
}

@Component({
  selector: 'treenav',
  templateUrl: 'treenav.component.html',
  styleUrls: ['treenav.component.scss'],
})
export class TreenavComponent {
  @Output() select = new EventEmitter<any>();

  treeControl = new NestedTreeControl<TreeNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<TreeNode>();
  cachedMap: any;

  constructor() {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    const query = { removed : { $in: [null, false] } };
    MeteorObservable.call('find', 'systemPermissions', query)
    .subscribe((data: any) => {
      this.dataSource.data = this.buildTree(data);
    });
  }

  buildTree(flatData) {
    const map = {};

    flatData.forEach((item) => {
      // make sure children property exists
      if (!item.children) {
        item.children = [];
      }
      // cache item on the map by id
      map[item._id] = item;
    });

    // cache the mapping, to be used later
    this.cachedMap = map;

    flatData.forEach((item) => {
      const { parentPermissionId } = item;
      // move the item to its parent node
      if (map[parentPermissionId]) {
        map[parentPermissionId].children.push(item);
        item.isChild = true;
      }
    });

    // filter the root nodes only
    return flatData.filter(item => !item.isChild);
  }

  getNodeName(node) {
    if (node.type === 'module') {
      return node.name.toUpperCase();
    }
    if (node.type === 'sideNav') {
      return node.label || node.name;
    }
    return node.name;
  }

  hasChild(_: number, node: TreeNode) {
    return !!node.children && node.children.length > 0;
  }

  selectNode(node) {
    this.select.emit(node);
  }

  insertTreeNode(node) {
    const { _id, parentPermissionId } = node;
    if (this.cachedMap[parentPermissionId]) {
      this.cachedMap[parentPermissionId].children.push(node);
    } else {
      this.dataSource.data.push(node);
    }
    this.cachedMap[_id] = node;
  }

  removeTreeNode(node) {
    const { _id, parentPermissionId } = node;
    if (this.cachedMap[parentPermissionId]) {
      this.cachedMap[parentPermissionId].children =
        this.cachedMap[parentPermissionId].children.filter((child) => {
          return child._id !== _id;
        });
    } else {
      this.dataSource.data =
        this.dataSource.data.filter((child) => {
          return child._id !== _id;
        });
    }
    delete this.cachedMap[_id];
  }

  updateTreeNode(node) {
    const { _id, parentPermissionId } = node;
    const nodeToBeUpdated = this.cachedMap[_id];
    if (nodeToBeUpdated.parentPermissionId !== parentPermissionId) {
      this.removeTreeNode(nodeToBeUpdated);
      this.insertTreeNode({ ...nodeToBeUpdated, ...node });
    }
  }

  updateTree($event) {
    const { type, data } = $event;
    const node = { ...data };

    switch (type) {
      case 'insert':
        node.children = [];
        this.insertTreeNode(node);
      break;
      case 'remove':
        this.removeTreeNode(node);
      break;
      case 'update':
        this.updateTreeNode(node);
      break;
      default:
        // do nothing
      break;
    }

    // workaround to refresh the tree
    const tempData = this.dataSource.data;
    this.dataSource.data = null;
    this.dataSource.data = tempData;
  }
}
