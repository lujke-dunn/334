package com.petapp.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class homeController {

    @GetMapping("/")
    public String home() {
        return "🐾 Welcome to Pet App Backend!";
    }
}

