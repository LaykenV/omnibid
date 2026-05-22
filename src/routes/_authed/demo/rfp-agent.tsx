import { createFileRoute } from '@tanstack/react-router'
import { RfpAgentDemoPage } from './-rfpAgentDemo'

export const Route = createFileRoute('/_authed/demo/rfp-agent')({
  component: RfpAgentDemoPage,
})
