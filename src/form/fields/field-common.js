import { default as SchemaStore } from '../../schema/store';
import { merge } from '../../util';
import { addClass } from 'wind-dom';

import Vue from 'vue';

export default {
  props: {
    form: {},
    model: {
      default() {
        return {};
      }
    },
    property: {},
    schema: {},
    label: {
      type: String
    },
    labelWidth: {
      default: 120
    },
    labelSuffix: {},
    editorWidth: {},
    required: {
      type: Boolean,
      default: null
    },
    hideLabel: {
      type: Boolean,
      default: false
    },
    hideHint: {
      type: Boolean,
      default: false
    },
    hintType: {
      type: String,
      default: ''
    },
    hintMessage: {
      type: String
    },
    parentProperty: {},
    mapping: {},
    editorFocused: {
      type: Boolean,
      defaultValue: true
    }
  },

  methods: {
    fetchMapping(...args) {
      var schema = this.fieldSchema;
      var emptyRecord = this.emptyRecord;
      if (schema) {
        var result = schema.getPropertyMapping(this.property, this.model, ...args);
        if (result.then) {
          result.then((value) => {
            this.selectValue = null;
            this.mapping = value;
            if (emptyRecord) {
              this.mapping[''] = null;
            }
          });
        } else {
          this.mapping = result;
          if (emptyRecord) {
            this.mapping[''] = null;
          }
        }
      }
    },

    validate() {
      var model = this.model;
      var schema = this.fieldSchema;

      if (schema) {
        schema.validateProperty(model, this.property);

        this.hintMessage = model.$hints[this.property];
        this.hintType = this.hintMessage ? 'error' : '';
      }
    }
  },

  events: {
    formModelChange() {
      var form = this.form;
      if (form && form.model) {
        if (this.model !== form.model) {
          this.model = form.model;
        }
      }
    }
  },

  computed: {
    realEditorWidth() {
      var editorWidth = this.editorWidth;
      if (editorWidth !== undefined && /^\d+$/.test('' + editorWidth)) {
        return editorWidth + 'px';
      }
      return editorWidth;
    },

    labelText() {
      let label = this.label;
      let labelSuffix = this.labelSuffix;
      return (label || '') + (labelSuffix || '');
    },

    isRequired() {
      if (typeof this.required !== 'undefined' && this.required !== null) {
        return this.required;
      }

      var property = this.property;
      var schema = this.fieldSchema;

      if (schema && property) {
        return !!schema.getPropertyDescriptor(property).required;
      }

      return false;
    },

    fieldSchema() {
      var schema = this.schema;
      if (!schema && this.form && this.form.schema) {
        schema = this.form.schema;
      }

      if (typeof schema === 'string') {
        schema = this.schema = SchemaStore.getSchema(schema);
      }

      return schema;
    }
  },

  onCreated() {
    if (this.$parent.$isForm) {
      this.form = this.$parent;
    }
  },

  onDestroyed() {
    if (this.model && this.model.$off && this.modelListener) {
      this.model.$off('reset', this.modelListener);
    }
  },

  onCompiled() {
    var form = this.form;

    if (form) {
      var className = this.$el.className;
      if (className.indexOf('d-cell-') === -1) {
        var fieldClass = form.fieldClass;
        addClass(this.$el, fieldClass);
      }

      if (!this._props.labelWidth.raw && form.labelWidth) {
        this.labelWidth = form.labelWidth;
      }

      if (!this._props.labelSuffix.raw && form.labelSuffix) {
        this.labelSuffix = form.labelSuffix;
      }

      if (!this._props.hideHint.raw && form.hideHint) {
        this.hideHint = form.hideHint;
      }

      if (!this._props.editorWidth.raw && form.editorWidth) {
        this.editorWidth = form.editorWidth;
      }

      if (form && form.model) {
        this.model = form.model;
      }
    }

    if (this.model && this.model.$on) {
      this.modelListener = () => {
        Vue.nextTick(() => {
          this.hintType = '';
          this.hintMessage = '';
        });
      };
      this.model.$on('reset', this.modelListener);
    }

    if (this.property) {
      this.$watch('model.' + this.property, function() {
        if (this.editorFocused) {
          this.validate();
        }
      });

      var property = this.property;
      if (!property) return;

      var schema = this.fieldSchema;
      if (!schema) return;

      if (!this.label) {
        this.label = schema.getPropertyLabel(property);
      }

      var mapping = schema.getPropertyMapping(property, this.model);
      if (!mapping) return;

      var emptyRecord = this.emptyRecord;
      if (mapping.then) {
        mapping.then((value) => {
          if (emptyRecord) {
            this.mapping = merge({ '': null }, value);
          } else {
            this.mapping = value;
          }
        });
      } else {
        if (emptyRecord) {
          this.mapping = merge({ '': null }, mapping);
        } else {
          this.mapping = mapping;
        }
      }
    }

    if (this.parentProperty) {
      this.$watch('model.' + this.parentProperty, () => {
        this.fetchMapping();
      });
    }
  }
};
