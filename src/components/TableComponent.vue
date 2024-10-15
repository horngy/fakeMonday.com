<template>
  <div>
    <table class="table">
      <thead>
        <tr>
          <th v-for="(header, index) in headers" :key="index">{{ header }}</th>
          <!-- Conditionally render the Action column header -->
          <th v-if="isButtons">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in data" :key="rowIndex">
          <td v-for="(cell, cellIndex) in row" :key="cellIndex">
            {{ cell }}
          </td>
          <!-- Conditionally render the button column -->
          <td v-if="isButtons">
            <button @click="handleButtonClick(row)">
              {{ buttonLabel }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "TableComponent",
  props: {
    headers: {
      type: Array,
      required: true,
    },
    data: {
      type: Array,
      required: true,
    },
    buttonLabel: {
      type: String,
      default: "Button", 
    },
    isButtons: {
      type: Boolean,
      default: false, // Default is false if not provided
    },
  },
  methods: {
    handleButtonClick(row) {
      // Emit a boolean and the row data
      this.$emit('button-clicked', true);
      this.$emit('row-data', row);
    },
  },
};
</script>

<style scoped>
.table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
}

th {
  background-color: #f2f2f2;
  text-align: left;
}

button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}
</style>
