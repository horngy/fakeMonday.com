<template>
    <div class="countdown">
        <div class="timer">
            {{ formattedTime }}
        </div>
    </div>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

export default {
    props: {
        EndDate: {
            type: [String, Date],
            required: true
        },
        StartDate: {
            type: [String, Date],
            required: true
        },
        started: {
            type: String
        },
    },
    
    setup(props, { emit }) {
        const startTime = new Date(props.StartDate).getTime();
        const endTime = new Date(props.EndDate).getTime(); 
        const currentTime = ref(new Date().getTime());
        const timeRemaining = ref(endTime - currentTime.value);
        const timeBeforeStart = ref(startTime - currentTime.value);

        const formattedTime = computed(() => {
            
            if (props.started !== "Active") {
                if (props.started === "Not Started") {
                    return "Not Started";
                }

                if (props.started === "Completed") {
                    return "Ended"; 
                }
            }

            if (timeBeforeStart.value > 0 && props.started.trim() === "Not Started") {
                return "Not Started";
            }
            
            const seconds = Math.floor(timeRemaining.value / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
        });

        let intervalId;

        onMounted(() => {
            intervalId = setInterval(updateTimer, 1000);
        });

        onBeforeUnmount(() => {
            clearInterval(intervalId);
        });

        function updateTimer() {
            currentTime.value = new Date().getTime();
            timeRemaining.value = Math.max(0, endTime - currentTime.value);
            timeBeforeStart.value = Math.max(0, startTime - currentTime.value);

            if (timeRemaining.value <= 0) {
                emit("countdown-finished");  // Emit the event when countdown ends
                clearInterval(intervalId);
            }
        }

        return {
            formattedTime,
        };
    },
};
</script>


<style>

.timer {
    margin-left: auto; /* Pushes the timer to the right without using a fixed margin */
    width: 270px; /* Adjust the width of the timer */
    font-size: 2rem;
    display: flex;
    align-items: center;
    padding: 1rem;
    background-color: #505050;
    color: #fff;
    text-align: center;
    border-radius: 0.5rem;
    position: relative; /* Ensure it's positioned properly within its container */
    right: 20px; /* Adjust right margin to avoid overlap */
}

</style>