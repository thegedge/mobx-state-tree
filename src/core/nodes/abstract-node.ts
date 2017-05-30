import {
    observable,
    computed
} from "mobx"

let nextNodeId = 1

export abstract class AbstractNode  {
    readonly nodeId = ++nextNodeId
    readonly type: IType<any, any>
    @observable protected _parent: ComplexNode | null = null
    @observable subpath: string = ""

    // TODO: should have environment as well?
    constructor(type: IType<any, any>, parent: ComplexNode | null, subpath: string) {
        this.type = type
        this._parent = parent
        this.subpath = subpath
    }

    /**
     * Returnes (escaped) path representation as string
     */
    @computed public get path(): string {
        if (!this.parent)
            return ""
        return this.parent.path + "/" + escapeJsonPath(this.subpath)
    }

    public get isRoot(): boolean {
        return this.parent === null
    }

    public get parent(): ComplexNode | null {
        return this._parent
    }

    public get root(): ComplexNode {
        // future optimization: store root ref in the node and maintain it
        let p, r: AbstractNode = this
        while (p = r.parent)
            r = p
        return r as ComplexNode
    }

    getRelativePathTo(target: AbstractNode): string {
        // PRE condition target is (a child of) base!
        if (this.root !== target.root) fail(`Cannot calculate relative path: objects '${this}' and '${target}' are not part of the same object tree`)

        const baseParts = splitJsonPath(this.path)
        const targetParts = splitJsonPath(target.path)
        let common = 0
        for (; common < baseParts.length; common++) {
            if (baseParts[common] !== targetParts[common])
                break
        }
        // TODO: assert that no targetParts paths are "..", "." or ""!
        return baseParts.slice(common).map(_ => "..").join("/")
            + joinJsonPath(targetParts.slice(common))
    }

    abstract get snapshot(): any;
    abstract getValue(): any
    abstract isLeaf(): boolean
    abstract getChildren(): AbstractNode[]
    abstract getChildNode(name: string): AbstractNode | null
    abstract setParent(newParent: ComplexNode, subpath: string): void
}

import { IType } from "../../types/type"
import { escapeJsonPath, splitJsonPath, joinJsonPath } from "../json-patch"
import { ComplexNode } from "./complex-node"
import { fail } from "../../utils"
