/**
 * @typedef {Object} RuleWhen
 * @property {string} field
 * @property {string} op
 * @property {string | number | null} value
 */

/**
 * @typedef {Object} RuleMatch
 * @property {string} targetField
 * @property {string} currentField
 */

/**
 * @typedef {Object} RuleAction
 * @property {string} op
 * @property {string} field
 * @property {string} valueFieldFromCurrent
 * @property {number} round
 */

/**
 * @typedef {Object} PtrsRule
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {boolean} enabled
 * @property {"row"|"crossRow"} type
 * @property {RuleWhen[]} when
 * @property {{ match?: RuleMatch[], where?: RuleWhen[] }} target
 * @property {RuleAction} action
 */
