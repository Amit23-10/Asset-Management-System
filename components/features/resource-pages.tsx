import { notFound } from 'next/navigation'
import { ResourceForm } from '@/components/features/resource-form'
import { ResourceList } from '@/components/features/resource-list'
import { getResource } from '@/lib/resources/registry'

type Group = 'Master' | 'Configuration' | 'Entry' | 'Process'
type ListProps = { params: Promise<{ resource: string }> }
type EditProps = { params: Promise<{ resource: string; id: string }> }

function resolve(group: Group, key: string) {
  const config = getResource(key)
  if (!config || (config.group ?? 'Master') !== group) notFound()
  return config
}

export function makeListPage(group: Group) {
  return async function ListPage({ params }: ListProps) {
    const { resource } = await params
    return <ResourceList resourceKey={resolve(group, resource).key} />
  }
}

export function makeNewPage(group: Group) {
  return async function NewPage({ params }: ListProps) {
    const { resource } = await params
    return <ResourceForm resourceKey={resolve(group, resource).key} />
  }
}

export function makeEditPage(group: Group) {
  return async function EditPage({ params }: EditProps) {
    const { resource, id } = await params
    return <ResourceForm resourceKey={resolve(group, resource).key} id={id} />
  }
}
