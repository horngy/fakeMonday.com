<template>
    <div class="user-page">
        <h3>Remove Users</h3>

        <div class="table-wrapper">
            <TableComponent 
                :key="tableKey"
                :headers="tableHeaders"
                :data="users"
                :buttonLabel="'Delete'"
                :is-buttons="true"
                @row-data="removeUserFromDatabase"
                class="table-component"
            />
        </div>
    </div>
</template>

<script>
import { collection, deleteDoc, getDocs, doc } from 'firebase/firestore';
import TableComponent from './components/TableComponent.vue';
import { db } from './firebase/init';

export default {
name: 'AdminPage',

components: {
    TableComponent,
},

data() {
    return {
    users: [],
    tableHeaders: ["username", "email", "role"],
    tableKey: 0,
    };
},

created() {
    this.fetchUsers(); // Call to fetch users when component is created
},

methods: {
    async fetchUsers() {
    try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        
        this.users = userSnapshot.docs.map(doc => {
        const { username, email, role } = doc.data();
        return { username, email, role };
        });

        this.users = this.users.filter(user => user.role !== "admin");
        
    } catch (error) {
        console.error("Error fetching users: ", error);
    }
    },

    async findUserIdByEmail(email) {
    try {
        const userCollection = collection(db, 'users');
        const userSnapshot = await getDocs(userCollection);
        const userIDs = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const user = userIDs.filter(user => user.email === email);
        return user[0].id;

    } catch (error) {
        console.error("Error fetching users: ", error);
    }
    },

    async removeUserFromDatabase(user) {
    try {
        const userID = await this.findUserIdByEmail(user.email);

        // Reference to the user's document in Firestore
        const userDocRef = doc(db, 'users', userID);

        // Remove the user from Firestore
        await deleteDoc(userDocRef);

        
        // Make a request to the server to delete the user
        await fetch('http://localhost:5000/deleteUser', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid: userID }), // Pass the UID to the server
        });

        // Remove the user from the local state
        this.users = this.users.filter(u => u.email !== user.email);
        this.tableKey += 1;

        console.log(`User ${user.username} deleted successfully`);
    } catch (error) {
        console.error("Error deleting user: ", error);
    }
}

}
};
</script>

<style scoped>
.user-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 100px;
    width: 100%; /* Ensure user-page takes full width */
}

.table-wrapper {
    background-color: rgb(47, 47, 47); /* Set the same background color as the datepicker */
    color: white; /* Ensure the text is white to make it readable */
    padding: 10px;
    border-radius: 8px;
    width: 100%;
    max-width: 90vw;
    position: relative;
    overflow-y:auto;
    height: 100vh; /* Full height of the viewport */
}

.table-component {
    width: 100%;
}

@media (min-width: 1200px) {
    .table-wrapper {
        max-width: 1200px;
    }
}
</style>
