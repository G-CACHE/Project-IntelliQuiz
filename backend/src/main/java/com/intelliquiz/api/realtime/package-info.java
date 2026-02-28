@org.springframework.modulith.ApplicationModule(
    allowedDependencies = {
        "shared", "auth", "auth :: dto",
        "quiz", "quiz :: dto", "team", "team :: dto",
        "submission", "submission :: dto", "scoreboard"
    }
)
package com.intelliquiz.api.realtime;
