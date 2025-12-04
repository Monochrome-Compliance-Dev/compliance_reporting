import { Stack, Typography, Button } from "@mui/material";
import RuleMetaSection from "./RuleMetaSection";
import RulePurposeSelect from "./RulePurposeSelect";
import RuleConditionBuilder from "./RuleConditionBuilder";
import RuleRelationshipBuilder from "./RuleRelationshipBuilder";
import RuleActionBuilder from "./RuleActionBuilder";
import RuleSummaryPreview from "./RuleSummaryPreview";

export default function RuleCard({ rule, index, headers, onUpdate, onRemove }) {
  return (
    <Stack spacing={2}>
      <RuleMetaSection rule={rule} index={index} onUpdate={onUpdate} />
      <RulePurposeSelect rule={rule} index={index} onUpdate={onUpdate} />
      <RuleConditionBuilder
        rule={rule}
        index={index}
        headers={headers}
        onUpdate={onUpdate}
      />
      {rule.type === "crossRow" && (
        <RuleRelationshipBuilder
          rule={rule}
          index={index}
          headers={headers}
          onUpdate={onUpdate}
        />
      )}
      <RuleActionBuilder
        rule={rule}
        index={index}
        headers={headers}
        onUpdate={onUpdate}
      />
      <RuleSummaryPreview rule={rule} />
      <Button color="error" size="small" onClick={onRemove}>
        Delete
      </Button>
    </Stack>
  );
}
